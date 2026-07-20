// ════════════════════════════════════════════════════════════
//  Attendance Controller
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { recordActivity } from '../services/streak.service.js';

const _markSchema = z.object({
  userId: z.string().cuid(),
  date: z.coerce.date().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'LATE']).default('PRESENT'),
  notes: z.string().max(300).optional(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
});

const _selfCheckInSchema = z.object({
  status: z.enum(['PRESENT', 'LEAVE']).default('PRESENT'),
  notes: z.string().max(300).optional(),
});

const todayDate = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const list = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'date', order } = req.validatedQuery;
  const where = {};
  // Intern sees only themselves
  if (req.user.role === 'INTERN') where.userId = req.user.id;
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
      include: { user: { select: { id: true, name: true, department: true, avatarUrl: true } } },
    }),
    prisma.attendance.count({ where }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const mark = asyncHandler(async (req, res) => {
  const { userId, date, status, notes, checkIn, checkOut } = req.body;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw ApiError.notFound('User not found');

  const day = (date ?? new Date());
  day.setUTCHours(0, 0, 0, 0);

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
  if (['PRESENT', 'LATE', 'HALF_DAY'].includes(status)) {
    await recordActivity(req.user.id);
  }
  res.json({ attendance: record });
});

export const summary = asyncHandler(async (req, res) => {
  const where = req.user.role === 'INTERN' ? { userId: req.user.id } : req.query.userId ? { userId: req.query.userId } : {};
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setUTCHours(0, 0, 0, 0);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const targetUserId = where.userId || req.user.id;

  const [present, absent, leave, total, todayRecord] = await Promise.all([
    prisma.attendance.count({ where: { ...where, date: { gte: start }, status: 'PRESENT' } }),
    prisma.attendance.count({ where: { ...where, date: { gte: start }, status: 'ABSENT' } }),
    prisma.attendance.count({ where: { ...where, date: { gte: start }, status: 'LEAVE' } }),
    prisma.attendance.count({ where: { ...where, date: { gte: start } } }),
    prisma.attendance.findUnique({
      where: { userId_date: { userId: targetUserId, date: today } },
      select: { status: true },
    }),
  ]);
  const markedToday = !!todayRecord && ['PRESENT', 'LATE', 'HALF_DAY'].includes(todayRecord.status);
  res.json({ present, absent, leave, total, rate: total ? Math.round(((present + leave) / total) * 100) : 0, markedToday });
});

export default { list, mark, checkInOut, summary };
