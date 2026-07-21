
// Reports Controller
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { emitToRoom, getIO } from '../sockets/index.js';
import {
  ACTIVE_REVIEW_STATUSES,
  EDITABLE_REPORT_STATUSES,
  FINAL_REPORT_STATUSES,
  buildWeeklyReportDraft,
  endOfWeek,
  getReportStatusMeta,
  startOfWeek,
  toDateKey,
  toUtcDateOnly,
} from '../utils/reports.js';
import { recordActivity } from '../services/streak.service.js';

const reportUserSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  department: true,
  email: true,
};

const reviewSelect = {
  id: true,
  status: true,
  rating: true,
  feedback: true,
  createdAt: true,
  reviewedBy: { select: { id: true, name: true, avatarUrl: true, role: true } },
};

const dailyLogSelect = {
  id: true,
  date: true,
  workDone: true,
  hoursWorked: true,
  technologiesUsed: true,
  challenges: true,
  tomorrowPlan: true,
  status: true,
  reopenedAt: true,
  lockedAt: true,
  createdAt: true,
  updatedAt: true,
};

const reportListInclude = {
  user: { select: reportUserSelect },
  reviews: { orderBy: { createdAt: 'desc' }, take: 1, select: reviewSelect },
};

const reportDetailInclude = {
  user: { select: reportUserSelect },
  dailyLogs: { orderBy: { date: 'asc' }, select: dailyLogSelect },
  reviews: { orderBy: { createdAt: 'desc' }, select: reviewSelect },
};

const dailyLogBaseSchema = z.object({
  date: z.coerce.date().optional(),
  workDone: z.string().trim().min(1, 'Please describe todays work'),
  hoursWorked: z.coerce.number().min(0).max(24),
  technologiesUsed: z.string().trim().max(1000).optional().nullable(),
  challenges: z.string().trim().max(2000).optional().nullable(),
  tomorrowPlan: z.string().trim().max(2000).optional().nullable(),
});

const reportCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  content: z.string().min(1).optional(),
  fileUrl: z.string().url().optional().nullable(),
  weekNumber: z.coerce.number().int().min(1).max(104).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED']).optional(),
});

const reportUpdateSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  content: z.string().optional(),
  fileUrl: z.string().url().optional().nullable(),
  weekNumber: z.coerce.number().int().min(1).max(104).optional(),
});

const reviewSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'REVIEWED', 'NEEDS_REVISION', 'APPROVED', 'REJECTED']),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  feedback: z.string().trim().max(2000).optional().nullable(),
});

function isAdminLike(role) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

function isToday(date) {
  return toDateKey(date) === toDateKey(new Date());
}

function getIsoWeekNumber(date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return Math.ceil((((value - yearStart) / 86400000) + 1) / 7);
}

async function getMentorInternIds(mentorId) {
  const interns = await prisma.internProfile.findMany({
    where: { mentorId },
    select: { userId: true },
  });
  return interns.map((intern) => intern.userId);
}

async function getScopeFilter(req, { userId, reportId } = {}) {
  if (req.user.role === 'INTERN') {
    if (userId && userId !== req.user.id) throw ApiError.forbidden();
    return { userId: req.user.id };
  }

  if (req.user.role === 'MENTOR') {
    const ids = await getMentorInternIds(req.user.id);
    const selectedUserId = userId || undefined;
    if (selectedUserId && !ids.includes(selectedUserId)) throw ApiError.forbidden();
    if (reportId) return { userId: { in: ids } };
    return ids.length ? { userId: { in: ids } } : { userId: '__none__' };
  }

  if (userId) return { userId };
  return {};
}

async function ensureCanAccessReport(req, report) {
  if (!report) throw ApiError.notFound();
  if (isAdminLike(req.user.role)) return;
  if (req.user.role === 'INTERN' && report.userId === req.user.id) return;
  if (req.user.role === 'MENTOR') {
    const ids = await getMentorInternIds(req.user.id);
    if (ids.includes(report.userId)) return;
  }
  throw ApiError.forbidden();
}

async function ensureCanManageDailyLog(req, log) {
  if (!log) throw ApiError.notFound();
  if (isAdminLike(req.user.role)) return;
  if (req.user.role === 'INTERN' && log.userId === req.user.id) return;
  if (req.user.role === 'MENTOR') {
    const ids = await getMentorInternIds(req.user.id);
    if (ids.includes(log.userId)) return;
  }
  throw ApiError.forbidden();
}

function decorateReport(report) {
  if (!report) return null;
  const meta = getReportStatusMeta(report.status);
  const reviewHistory = report.reviews || [];
  const latestReview = reviewHistory[0] || null;
  return {
    ...report,
    statusLabel: meta.label,
    statusVariant: meta.variant,
    latestReview,
    feedbackHistory: reviewHistory,
  };
}

function responseWithSummary(report) {
  const decorated = decorateReport(report);
  const summary = buildWeeklyReportDraft(decorated?.dailyLogs || [], {
    weekStart: decorated?.weekStartDate,
    weekEnd: decorated?.weekEndDate,
  });
  return { ...decorated, summary };
}

export const list = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'submittedAt', order, search } = req.validatedQuery;
  const scope = await getScopeFilter(req, { userId: req.query.userId });
  const where = { ...scope };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (req.query.status) where.status = req.query.status;

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: reportListInclude,
    }),
    prisma.report.count({ where }),
  ]);

  res.json({
    items: items.map((report) => {
      const decorated = decorateReport(report);
      return {
        ...decorated,
        summary: buildWeeklyReportDraft(report.dailyLogs || [], {
          weekStart: report.weekStartDate,
          weekEnd: report.weekEndDate,
        }).summary,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const getById = asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({
    where: { id: req.validatedParams.id },
    include: reportDetailInclude,
  });
  await ensureCanAccessReport(req, report);
  res.json({ report: responseWithSummary(report) });
});

export const currentWeek = asyncHandler(async (req, res) => {
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const [dailyLogs, report] = await Promise.all([
    prisma.dailyWorkLog.findMany({
      where: { userId: req.user.id, date: { gte: weekStart, lte: weekEnd } },
      orderBy: { date: 'asc' },
      select: dailyLogSelect,
    }),
    prisma.report.findFirst({
      where: {
    userId: req.user.id,
},
orderBy: {
    createdAt: "desc",
},
      include: reportDetailInclude,
    }),
  ]);

  const draft = buildWeeklyReportDraft(dailyLogs, { weekStart, weekEnd });
  const todayKey = toDateKey(new Date());
  const todayLog = dailyLogs.find((log) => toDateKey(log.date) === todayKey) || null;
  const missingToday = !todayLog;

  res.json({
    report: report ? responseWithSummary(report) : null,
    preview: report ? responseWithSummary(report) : { ...draft, status: 'DRAFT', statusLabel: 'Draft', statusVariant: 'gray', dailyLogs },
    dailyLogs,
    todayLog,
    missingToday,
  });
});

export const listDailyLogs = asyncHandler(async (req, res) => {
  const scope = await getScopeFilter(req, { userId: req.query.userId });
  const where = { ...scope };
  if (req.query.date) {
    const date = toUtcDateOnly(req.query.date);
    if (date) where.date = date;
  }
  if (req.query.from || req.query.to) {
    where.date = {};
    if (req.query.from) where.date.gte = toUtcDateOnly(req.query.from);
    if (req.query.to) where.date.lte = toUtcDateOnly(req.query.to);
  }

  const items = await prisma.dailyWorkLog.findMany({
    where,
    orderBy: { date: 'desc' },
    select: {
      ...dailyLogSelect,
      report: { select: { id: true, title: true, status: true, weekStartDate: true, weekEndDate: true } },
      reopenedBy: { select: { id: true, name: true } },
    },
  });

  const todayKey = toDateKey(new Date());
  res.json({
    items: items.map((log) => ({
      ...log,
      canEdit: req.user.role === 'MENTOR' || isAdminLike(req.user.role) || (req.user.role === 'INTERN' && (toDateKey(log.date) === todayKey || log.status === 'REOPENED')),
    })),
  });
});

export const createDailyLog = asyncHandler(async (req, res) => {
  const data = dailyLogBaseSchema.parse(req.body);
  const date = toUtcDateOnly(data.date || new Date());
  if (!date) throw ApiError.badRequest('Invalid log date');
  if (req.user.role === 'INTERN' && !isToday(date)) {
    throw ApiError.forbidden('You can only create todays log');
  }

  const existing = await prisma.dailyWorkLog.findUnique({
    where: { userId_date: { userId: req.user.id, date } },
  });

  if (existing) {
    if (req.user.role === 'INTERN' && !isToday(existing.date) && existing.status !== 'REOPENED') {
      throw ApiError.forbidden('Past logs are read only');
    }
    const updated = await prisma.dailyWorkLog.update({
      where: { id: existing.id },
      data: {
        workDone: data.workDone,
        hoursWorked: data.hoursWorked,
        technologiesUsed: data.technologiesUsed || null,
        challenges: data.challenges || null,
        tomorrowPlan: data.tomorrowPlan || null,
      },
    });
    await audit({ userId: req.user.id, action: 'dailyLog.update', resource: 'dailyWorkLog', resourceId: updated.id, req });
    return res.json({ log: updated });
  }

  const log = await prisma.dailyWorkLog.create({
    data: {
      userId: req.user.id,
      date,
      workDone: data.workDone,
      hoursWorked: data.hoursWorked,
      technologiesUsed: data.technologiesUsed || null,
      challenges: data.challenges || null,
      tomorrowPlan: data.tomorrowPlan || null,
      status: 'OPEN',
    },
  });
  await audit({ userId: req.user.id, action: 'dailyLog.create', resource: 'dailyWorkLog', resourceId: log.id, req });
  res.status(201).json({ log });
});

export const updateDailyLog = asyncHandler(async (req, res) => {
  const log = await prisma.dailyWorkLog.findUnique({ where: { id: req.validatedParams.id } });
  await ensureCanManageDailyLog(req, log);
  if (req.user.role === 'INTERN' && !isToday(log.date) && log.status !== 'REOPENED') {
    throw ApiError.forbidden('Past logs are read only');
  }
  const data = dailyLogBaseSchema.parse(req.body);
  const updated = await prisma.dailyWorkLog.update({
    where: { id: log.id },
    data: {
      workDone: data.workDone,
      hoursWorked: data.hoursWorked,
      technologiesUsed: data.technologiesUsed || null,
      challenges: data.challenges || null,
      tomorrowPlan: data.tomorrowPlan || null,
    },
  });
  await audit({ userId: req.user.id, action: 'dailyLog.update', resource: 'dailyWorkLog', resourceId: log.id, req });
  res.json({ log: updated });
});

export const reopenDailyLog = asyncHandler(async (req, res) => {
  const log = await prisma.dailyWorkLog.findUnique({ where: { id: req.validatedParams.id } });
  await ensureCanManageDailyLog(req, log);
  if (!isAdminLike(req.user.role) && req.user.role !== 'MENTOR') {
    throw ApiError.forbidden('Only mentors and admins can reopen logs');
  }
  const reopened = await prisma.dailyWorkLog.update({
    where: { id: log.id },
    data: {
      status: 'REOPENED',
      reopenedById: req.user.id,
      reopenedAt: new Date(),
      lockedAt: null,
    },
  });
  await audit({ userId: req.user.id, action: 'dailyLog.reopen', resource: 'dailyWorkLog', resourceId: log.id, req });
  res.json({ log: reopened });
});

export const generateWeekly = asyncHandler(async (req, res) => {
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());

  const dailyLogs = await prisma.dailyWorkLog.findMany({
    where: {
      userId: req.user.id,
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  if (!dailyLogs.length) {
    throw ApiError.badRequest(
      'Add at least one daily log before generating a weekly report'
    );
  }

  const draft = buildWeeklyReportDraft(dailyLogs, {
    weekStart,
    weekEnd,
  });

  const report = await prisma.report.create({
    data: {
      userId: req.user.id,
      title: draft.title,
      content: draft.content,
      weekNumber: getIsoWeekNumber(weekStart),
      weekStartDate: toUtcDateOnly(weekStart),
      weekEndDate: toUtcDateOnly(weekEnd),
      generatedAt: new Date(),
      status: 'DRAFT',
      score: null,
      feedback: null,
      reviewedAt: null,
      reviewedById: null,
    },
    include: reportDetailInclude,
  });

  await prisma.dailyWorkLog.updateMany({
    where: {
      id: {
        in: dailyLogs.map((log) => log.id),
      },
    },
    data: {
      reportId: report.id,
      status: 'OPEN',
    },
  });

  await audit({
    userId: req.user.id,
    action: 'report.generate',
    resource: 'report',
    resourceId: report.id,
    meta: {
      weekNumber: report.weekNumber,
    },
    req,
  });

  res.status(201).json({
    report: responseWithSummary(report),
  });
});

export const create = asyncHandler(async (req, res) => {
  const data = reportCreateSchema.parse(req.body);
  const report = await prisma.report.create({
    data: {
      userId: req.user.id,
      title: data.title,
      content: data.content,
      fileUrl: data.fileUrl || null,
      weekNumber: data.weekNumber,
      status: data.status || 'DRAFT',
    },
  });
  await audit({ userId: req.user.id, action: 'report.create', resource: 'report', resourceId: report.id, req });
  res.status(201).json({ report });
});

export const update = asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({ where: { id: req.validatedParams.id } });
  await ensureCanAccessReport(req, report);
  if (!isAdminLike(req.user.role) && !EDITABLE_REPORT_STATUSES.has(report.status)) {
    throw ApiError.forbidden('Only draft or revision reports can be edited');
  }
  const data = reportUpdateSchema.parse(req.body);
  const updated = await prisma.report.update({
    where: { id: report.id },
    data: {
      title: data.title,
      content: data.content,
      fileUrl: data.fileUrl,
      weekNumber: data.weekNumber,
    },
    include: reportDetailInclude,
  });
  await audit({ userId: req.user.id, action: 'report.update', resource: 'report', resourceId: report.id, req });
  res.json({ report: responseWithSummary(updated) });
});

export const submit = asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({
    where: { id: req.validatedParams.id },
    include: reportDetailInclude,
  });
  await ensureCanAccessReport(req, report);
  if (!EDITABLE_REPORT_STATUSES.has(report.status)) {
    throw ApiError.forbidden('Only draft or revision reports can be submitted');
  }
  if (!report.content || !report.content.trim()) {
    throw ApiError.badRequest('Cannot submit an empty report');
  }
  const updated = await prisma.report.update({
    where: { id: report.id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      reviewedById: null,
      reviewedAt: null,
      score: null,
    },
    include: reportDetailInclude,
  });
  await audit({ userId: req.user.id, action: 'report.submit', resource: 'report', resourceId: report.id, req });
  const profile = await prisma.internProfile.findUnique({ where: { userId: req.user.id } });
  if (profile?.mentorId) {
    await notify(profile.mentorId, {
      type: 'report',
      title: `${req.user.name} submitted a weekly report`,
      body: updated.title,
      link: `/reports/${updated.id}`,
    });
  }
  res.json({ report: responseWithSummary(updated) });
  await recordActivity(req.user.id);
  res.status(201).json({ report });
});


export const review = asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({
    where: { id: req.validatedParams.id },
    include: reportDetailInclude,
  });
  await ensureCanAccessReport(req, report);
  if (!FINAL_REPORT_STATUSES.has(report.status) && !ACTIVE_REVIEW_STATUSES.has(report.status) && report.status !== 'SUBMITTED' && report.status !== 'UNDER_REVIEW') {
    throw ApiError.forbidden('Cannot review a draft report');
  }

  const { status, rating, feedback } = reviewSchema.parse(req.body);
  if (status === 'APPROVED' && rating == null) {
    throw ApiError.badRequest('Rating is required before approval');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const reportUpdate = await tx.report.update({
      where: { id: report.id },
      data: {
        status,
        score: rating == null ? report.score : rating * 2,
        feedback: feedback || null,
        reviewedById: req.user.id,
        reviewedAt: new Date(),
      },
      include: reportDetailInclude,
    });

    await tx.reportReview.create({
      data: {
        reportId: report.id,
        reviewedById: req.user.id,
        status,
        rating: rating ?? null,
        feedback: feedback || null,
      },
    });
    if (status === "NEEDS_REVISION") {
  await tx.dailyWorkLog.updateMany({
    where: {
      reportId: report.id,
    },
    data: {
      status: "REOPENED",
      reopenedById: req.user.id,
      reopenedAt: new Date(),
      lockedAt: null,
    },
  });
}

    return reportUpdate;
  });

  const refreshed = await prisma.report.findUnique({
    where: { id: report.id },
    include: reportDetailInclude,
  });

  await audit({ userId: req.user.id, action: 'report.review', resource: 'report', resourceId: report.id, meta: { status, rating }, req });
  await notify(refreshed.userId, {
    type: 'report',
    title: `Your report was ${status.toLowerCase().replaceAll('_', ' ')}`,
    body: `${updated.title}${rating ? ` - Rating ${rating}/5` : ''}`,
    link: `/reports/${updated.id}`,
  });
  getIO()?.to(`user:${updated.userId}`).emit('report:reviewed', { reportId: updated.id, status, rating });
  emitToRoom('role:MENTOR', 'dashboard:refresh', {});
  emitToRoom('role:ADMIN', 'dashboard:refresh', {});
  emitToRoom('role:SUPER_ADMIN', 'dashboard:refresh', {});
  res.json({ report: responseWithSummary(refreshed) });
});

export const history = asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({
    where: { id: req.validatedParams.id },
    include: { reviews: { orderBy: { createdAt: 'desc' }, select: reviewSelect } },
  });
  await ensureCanAccessReport(req, report);
  res.json({ items: report.reviews });
});

export const remove = asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({ where: { id: req.validatedParams.id } });
  await ensureCanAccessReport(req, report);
  if (!isAdminLike(req.user.role) && report.userId !== req.user.id) {
    throw ApiError.forbidden();
  }
  await prisma.report.delete({ where: { id: report.id } });
  await audit({ userId: req.user.id, action: 'report.delete', resource: 'report', resourceId: report.id, req });
  res.json({ ok: true });
});

export const stats = asyncHandler(async (req, res) => {
  const scope = await getScopeFilter(req, { userId: req.query.userId });
  const where = { ...scope };
  const [total, draft, submitted, pending, reviewed, rejected, approved, needsRevision] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.count({ where: { ...where, status: 'DRAFT' } }),
    prisma.report.count({ where: { ...where, status: 'SUBMITTED' } }),
    prisma.report.count({ where: { ...where, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'PENDING'] } } }),
    prisma.report.count({ where: { ...where, status: { in: ['REVIEWED', 'APPROVED'] } } }),
    prisma.report.count({ where: { ...where, status: 'REJECTED' } }),
    prisma.report.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.report.count({ where: { ...where, status: 'NEEDS_REVISION' } }),
  ]);

  const avgScore = await prisma.report.aggregate({
    where: { ...where, score: { not: null } },
    _avg: { score: true },
  });

  const latestFeedback = await prisma.report.findFirst({
    where: { ...where, reviewedAt: { not: null } },
    orderBy: { reviewedAt: 'desc' },
    select: { reviewedAt: true },
  });

  res.json({
    total,
    submitted,
    pending,
    reviewed,
    rejected,
    approved,
    needsRevision,
    averageScore: avgScore._avg.score,
    averageRating: avgScore._avg.score == null ? null : Math.round((avgScore._avg.score / 2) * 10) / 10,
    lastFeedbackDate: latestFeedback?.reviewedAt || null,
    weeklyReportsSubmitted: total - draft,
    pendingReview: pending,
  });
});

export default {
  list,
  getById,
  currentWeek,
  listDailyLogs,
  createDailyLog,
  updateDailyLog,
  reopenDailyLog,
  generateWeekly,
  create,
  update,
  submit,
  review,
  history,
  remove,
  stats,
};

