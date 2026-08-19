// ════════════════════════════════════════════════════════════
//  Attendance Controller
// ════════════════════════════════════════════════════════════
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../services/audit.service.js";

const _markSchema = z.object({
  userId: z.string().cuid(),
  date: z.coerce.date().optional(),
  status: z
    .enum(["PRESENT", "ABSENT", "LEAVE", "HALF_DAY", "LATE"])
    .default("PRESENT"),
  notes: z.string().max(300).optional(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
});

const _selfCheckInSchema = z.object({
  status: z.enum(["PRESENT", "LEAVE"]).default("PRESENT"),
  notes: z.string().max(300).optional(),
});

const _leaveRequestSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(3).max(300),
});

const todayDate = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const isPresentLike = (status) =>
  status === "PRESENT" || status === "LATE" || status === "HALF_DAY";
const toKey = (d) => d.toISOString().slice(0, 10);

export const list = asyncHandler(async (req, res) => {
  const { page, limit, sort = "date", order } = req.validatedQuery;
  const where = {};
  // Intern sees only themselves
  if (req.user.role === "INTERN") where.userId = req.user.id;
  else if (req.query.userId) where.userId = req.query.userId;
  if (req.query.date) {
    const d = new Date(req.query.date);
    d.setUTCHours(0, 0, 0, 0);
    where.date = d;
  }
  if (req.query.status) where.status = req.query.status;

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, department: true, avatarUrl: true },
        },
      },
    }),
    prisma.attendance.count({ where }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const mark = asyncHandler(async (req, res) => {
  const { userId, date, status, notes, checkIn, checkOut } = req.body;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw ApiError.notFound("User not found");

  const day = date ?? new Date();
  day.setUTCHours(0, 0, 0, 0);

  const record = await prisma.attendance.upsert({
    where: { userId_date: { userId, date: day } },
    update: { status, notes, checkIn, checkOut, markedById: req.user.id },
    create: {
      userId,
      date: day,
      status,
      notes,
      checkIn,
      checkOut,
      markedById: req.user.id,
    },
  });
  await audit({
    userId: req.user.id,
    action: "attendance.mark",
    resource: "attendance",
    resourceId: record.id,
    meta: { userId, status },
    req,
  });
  res.json({ attendance: record });
});

export const checkInOut = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const day = todayDate();
  const now = new Date();
  const record = await prisma.attendance.upsert({
    where: { userId_date: { userId: req.user.id, date: day } },
    update: {
      status,
      notes,
      checkIn: now,
    },
    create: {
      userId: req.user.id,
      date: day,
      status,
      notes,
      checkIn: now,
    },
  });
  res.json({ attendance: record });
});

export const summary = asyncHandler(async (req, res) => {
  const where =
    req.user.role === "INTERN"
      ? { userId: req.user.id }
      : req.query.userId
        ? { userId: req.query.userId }
        : {};
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setUTCHours(0, 0, 0, 0);

  const [present, absent, leave, total] = await Promise.all([
    prisma.attendance.count({
      where: { ...where, date: { gte: start }, status: "PRESENT" },
    }),
    prisma.attendance.count({
      where: { ...where, date: { gte: start }, status: "ABSENT" },
    }),
    prisma.attendance.count({
      where: { ...where, date: { gte: start }, status: "LEAVE" },
    }),
    prisma.attendance.count({ where: { ...where, date: { gte: start } } }),
  ]);
  res.json({
    present,
    absent,
    leave,
    total,
    rate: total ? Math.round(((present + leave) / total) * 100) : 0,
  });
});

// ── Streak + risk indicator ─────────────────────────────────
// LEAVE days behave like weekends: they pause the streak instead
// of breaking it. Only ABSENT (or an unmarked working day) breaks it.
export const streak = asyncHandler(async (req, res) => {
  const userId =
    req.user.role === "INTERN" ? req.user.id : req.query.userId || req.user.id;

  const since = new Date();
  since.setDate(since.getDate() - 60);
  since.setUTCHours(0, 0, 0, 0);

  const records = await prisma.attendance.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" },
    select: { date: true, status: true },
  });

  const byDate = new Map(records.map((r) => [toKey(r.date), r.status]));
  const todayKey = toKey(todayDate());

  // ── current streak: walk backward from today ──
  let currentStreak = 0;
  let cursor = todayDate();

  for (let guard = 0; guard < 60; guard += 1) {
    const day = cursor.getUTCDay();
    const key = toKey(cursor);

    if (day === 0 || day === 6) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    const status = byDate.get(key);

    if (!status && key === todayKey) {
      // today not marked yet — don't break the streak, check yesterday
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (status === "LEAVE") {
      // paused, not broken, not counted
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (status && isPresentLike(status)) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // ── longest streak in the fetched window ──
  let longestStreak = 0;
  let running = 0;
  for (const r of records) {
    if (isPresentLike(r.status)) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else if (r.status === "ABSENT") {
      running = 0;
    }
    // LEAVE: paused — running carries over unchanged
  }

  // ── risk window: trailing 7 & 14 days, unexplained absences only ──
  const last14Start = new Date();
  last14Start.setDate(last14Start.getDate() - 14);
  last14Start.setUTCHours(0, 0, 0, 0);
  const last7Start = new Date();
  last7Start.setDate(last7Start.getDate() - 7);
  last7Start.setUTCHours(0, 0, 0, 0);

  const absences14 = records.filter(
    (r) => r.date >= last14Start && r.status === "ABSENT",
  ).length;
  const absences7 = records.filter(
    (r) => r.date >= last7Start && r.status === "ABSENT",
  ).length;

  let risk = "LOW";
  if (absences14 >= 3 || (currentStreak === 0 && absences7 >= 1)) {
    risk = "HIGH";
  } else if (absences14 >= 1) {
    risk = "MEDIUM";
  }

  const onLeaveToday = byDate.get(todayKey) === "LEAVE";

  res.json({
    currentStreak,
    longestStreak,
    absences7,
    absences14,
    risk,
    onLeaveToday,
  });
});

// ── Leave request: marks a date range as LEAVE for the logged-in
//    intern, so the streak pauses instead of breaking. Weekends
//    inside the range are skipped automatically.
export const requestLeave = asyncHandler(async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);

  if (end < start)
    throw ApiError.badRequest("End date cannot be before start date");

  const spanDays = Math.round((end - start) / 86400000) + 1;
  if (spanDays > 30)
    throw ApiError.badRequest("Leave range cannot exceed 30 days");

  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    days.push(new Date(d));
  }
  if (!days.length)
    throw ApiError.badRequest("No working days in the selected range");

  const records = await Promise.all(
    days.map((date) =>
      prisma.attendance.upsert({
        where: { userId_date: { userId: req.user.id, date } },
        update: { status: "LEAVE", notes: reason },
        create: { userId: req.user.id, date, status: "LEAVE", notes: reason },
      }),
    ),
  );

  await audit({
    userId: req.user.id,
    action: "attendance.leave.request",
    resource: "attendance",
    resourceId: records[0]?.id,
    meta: { startDate, endDate, reason, days: days.length },
    req,
  });

  res.json({ marked: records.length, records });
});

export default { list, mark, checkInOut, summary, streak, requestLeave };
