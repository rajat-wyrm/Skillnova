// ════════════════════════════════════════════════════════════
//  Reports Controller
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { emitToRoom, getIO } from '../sockets/index.js';
import { recordActivity } from '../services/streak.service.js';

// Validators (also enforced at the route level for consistency)
const _createSchema = z.object({
  title: z.string().trim().min(3).max(200),
  content: z.string().min(1).optional(),
  fileUrl: z.string().url().optional().nullable(),
  weekNumber: z.coerce.number().int().min(1).max(104).optional(),
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'submittedAt', order, search } = req.validatedQuery;
  const where = {};
  // Interns only see their own
  if (req.user.role === 'INTERN') where.userId = req.user.id;
  // Mentors see reports of their interns
  else if (req.user.role === 'MENTOR') {
    const interns = await prisma.user.findMany({
      where: { role: 'INTERN', internProfile: { mentorId: req.user.id } },
      select: { id: true },
    });
    where.userId = { in: interns.map((i) => i.id) };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (req.query.status) where.status = req.query.status;
  if (req.query.userId && req.user.role !== 'INTERN') where.userId = req.query.userId;

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, avatarUrl: true, department: true } } },
    }),
    prisma.report.count({ where }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const getById = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, department: true, email: true } },
    },
  });
  if (!report) throw ApiError.notFound();
  // Authorization: own report, mentor of owner, or admin+
  const isOwn = report.userId === req.user.id;
  const isReviewer = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
  let isMentor = false;
  if (!isOwn && !isReviewer && req.user.role === 'MENTOR') {
    const intern = await prisma.internProfile.findFirst({
      where: { userId: report.userId, mentorId: req.user.id },
    });
    isMentor = !!intern;
  }
  if (!isOwn && !isReviewer && !isMentor) throw ApiError.forbidden();
  res.json({ report });
});

export const create = asyncHandler(async (req, res) => {
  const data = req.body;
  const report = await prisma.report.create({
    data: { ...data, userId: req.user.id },
  });
  await audit({ userId: req.user.id, action: 'report.create', resource: 'report', resourceId: report.id, req });
  // Notify mentor
  const profile = await prisma.internProfile.findUnique({ where: { userId: req.user.id } });
  if (profile?.mentorId) {
    await notify(profile.mentorId, {
      type: 'report',
      title: `${req.user.name} submitted a report`,
      body: report.title,
      link: `/reports/${report.id}`,
    });
  }
  await recordActivity(req.user.id);
  res.status(201).json({ report });
});

export const update = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const existing = await prisma.report.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound();
  const canEdit = existing.userId === req.user.id && existing.status === 'DRAFT';
  const canEditAny = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
  if (!canEdit && !canEditAny) throw ApiError.forbidden('Cannot edit this report');
  const report = await prisma.report.update({ where: { id }, data: req.body });
  await audit({ userId: req.user.id, action: 'report.update', resource: 'report', resourceId: id, req });
  res.json({ report });
});

export const review = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const { status, score, feedback } = req.body;
  const report = await prisma.report.update({
    where: { id },
    data: {
      status,
      score,
      feedback,
      reviewedById: req.user.id,
      reviewedAt: new Date(),
    },
  });
  await audit({ userId: req.user.id, action: 'report.review', resource: 'report', resourceId: id, meta: { status, score }, req });
  await notify(report.userId, {
    type: 'report',
    title: `Your report was ${status.toLowerCase()}`,
    body: `${report.title}${score ? ` — Score ${score}/10` : ''}`,
    link: `/reports/${report.id}`,
  });
  getIO()?.to(`user:${report.userId}`).emit('report:reviewed', { reportId: report.id, status });
  emitToRoom(`role:MENTOR`, 'dashboard:refresh', {});
  emitToRoom(`role:ADMIN`, 'dashboard:refresh', {});
  emitToRoom(`role:SUPER_ADMIN`, 'dashboard:refresh', {});
  res.json({ report });
});

export const remove = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const existing = await prisma.report.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound();
  if (existing.userId !== req.user.id && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    throw ApiError.forbidden();
  }
  await prisma.report.delete({ where: { id } });
  await audit({ userId: req.user.id, action: 'report.delete', resource: 'report', resourceId: id, req });
  res.json({ ok: true });
});

export const stats = asyncHandler(async (req, res) => {
  const where = req.user.role === 'INTERN' ? { userId: req.user.id } : {};
  const [total, pending, reviewed, rejected] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.count({ where: { ...where, status: 'PENDING' } }),
    prisma.report.count({ where: { ...where, status: 'REVIEWED' } }),
    prisma.report.count({ where: { ...where, status: 'REJECTED' } }),
  ]);
  const avgScore = await prisma.report.aggregate({
    where: { ...where, status: 'REVIEWED', score: { not: null } },
    _avg: { score: true },
  });
  res.json({ total, pending, reviewed, rejected, averageScore: avgScore._avg.score });
});

export default { list, getById, create, update, review, remove, stats };
