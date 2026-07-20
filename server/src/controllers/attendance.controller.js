// ════════════════════════════════════════════════════════════
//  Attendance Controller
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { recordActivity } from '../services/streak.service.js';

const toDayStart = (value = new Date()) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getBaseWhere = async (req) => {
  if (req.user.role === 'INTERN') return { userId: req.user.id };

  if (req.user.role === 'MENTOR') {
    const interns = await prisma.user.findMany({
      where: { role: 'INTERN', internProfile: { mentorId: req.user.id } },
      select: { id: true },
    });
    const internIds = interns.map((intern) => intern.id);

    if (req.query.userId) {
      return internIds.includes(req.query.userId) ? { userId: req.query.userId } : { userId: '__no_match__' };
    }

    return { userId: { in: internIds } };
  }

  return req.query.userId ? { userId: req.query.userId } : {};
};

const getTodayState = (record) => {
  if (!record) return { label: 'Not Checked In', canCheckIn: true, canCheckOut: false };
  if (record.status === 'LEAVE') return { label: 'Leave', canCheckIn: false, canCheckOut: false };
  if (record.checkOut) return { label: 'Checked Out', canCheckIn: false, canCheckOut: false };
  if (record.checkIn) return { label: 'Checked In', canCheckIn: false, canCheckOut: true };
  if (record.status === 'PRESENT') return { label: 'Present', canCheckIn: true, canCheckOut: false };
  return { label: record.status, canCheckIn: true, canCheckOut: false };
};

export const list = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'date', order } = req.validatedQuery;
  const where = await getBaseWhere(req);

  if (req.query.date) where.date = toDayStart(req.query.date);
  if (req.query.status) where.status = req.query.status;

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, department: true, avatarUrl: true } } },
    }),
    prisma.attendance.count({ where }),
  ]);

  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const today = asyncHandler(async (req, res) => {
  const where = await getBaseWhere(req);
  const userId = where.userId && typeof where.userId === 'string'
    ? where.userId
    : req.user.id;

  const attendance = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: toDayStart() } },
  });

  res.json({ attendance, ...getTodayState(attendance) });
});

export const mark = asyncHandler(async (req, res) => {
  const { userId, date, status, notes, checkIn, checkOut } = req.body;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw ApiError.notFound('User not found');

  const day = toDayStart(date ?? new Date());
  const record = await prisma.attendance.upsert({
    where: { userId_date: { userId, date: day } },
    update: { status, notes, checkIn, checkOut, markedById: req.user.id },
    create: { userId, date: day, status, notes, checkIn, checkOut, markedById: req.user.id },
  });

  await audit({ userId: req.user.id, action: 'attendance.mark', resource: 'attendance', resourceId: record.id, meta: { userId, status }, req });
  if (['PRESENT', 'LATE', 'HALF_DAY'].includes(status)) {
    await recordActivity(userId);
  }
  res.json({ attendance: record });
});

export const checkInOut = asyncHandler(async (req, res) => {
  const { action, notes } = req.body;
  const day = toDayStart();
  const now = new Date();
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: req.user.id, date: day } },
  });

  if (action === 'CHECK_IN') {
    if (existing?.status === 'LEAVE') throw ApiError.badRequest('You are already marked on leave for today.');
    if (existing?.checkIn) throw ApiError.badRequest('You have already checked in today.');

    const attendance = await prisma.attendance.upsert({
      where: { userId_date: { userId: req.user.id, date: day } },
      update: {
        status: 'PRESENT',
        notes: notes ?? existing?.notes,
        checkIn: now,
      },
      create: {
        userId: req.user.id,
        date: day,
        status: 'PRESENT',
        notes,
        checkIn: now,
      },
    });

    await audit({ userId: req.user.id, action: 'attendance.check_in', resource: 'attendance', resourceId: attendance.id, req });
    await recordActivity(req.user.id);
    return res.json({ attendance, ...getTodayState(attendance) });
  }

  if (!existing?.checkIn) throw ApiError.badRequest('Please check in before checking out.');
  if (existing.checkOut) throw ApiError.badRequest('You have already checked out today.');

  const attendance = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      checkOut: now,
      notes: notes ?? existing.notes,
    },
  });

  await audit({ userId: req.user.id, action: 'attendance.check_out', resource: 'attendance', resourceId: attendance.id, req });
  return res.json({ attendance, ...getTodayState(attendance) });
});

export const summary = asyncHandler(async (req, res) => {
  const where = await getBaseWhere(req);
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setUTCHours(0, 0, 0, 0);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const targetUserId =
    typeof where.userId === 'string'
      ? where.userId
      : req.user.role === 'INTERN'
        ? req.user.id
        : null;

  const [present, absent, leave, total, todayRecord] = await Promise.all([
    prisma.attendance.count({ where: { ...where, date: { gte: start }, status: 'PRESENT' } }),
    prisma.attendance.count({ where: { ...where, date: { gte: start }, status: 'ABSENT' } }),
    prisma.attendance.count({ where: { ...where, date: { gte: start }, status: 'LEAVE' } }),
    prisma.attendance.count({ where: { ...where, date: { gte: start } } }),
    targetUserId
      ? prisma.attendance.findUnique({
          where: { userId_date: { userId: targetUserId, date: today } },
          select: { status: true },
        })
      : Promise.resolve(null),
  ]);

  const rate = total ? Math.round(((present + leave) / total) * 100) : 0;
  const markedToday = !!todayRecord && ['PRESENT', 'LATE', 'HALF_DAY'].includes(todayRecord.status);
  res.json({
    present,
    absent,
    leave,
    total,
    rate,
    presentDays: present,
    absentDays: absent,
    leaveDays: leave,
    totalWorkingDays: total,
    attendancePercentage: rate,
    markedToday,
  });
});

export default { list, today, mark, checkInOut, summary };
