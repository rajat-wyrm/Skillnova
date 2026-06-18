// ════════════════════════════════════════════════════════════
//  Notifications Controller + Analytics
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.validatedQuery ?? { page: 1, limit: 20 };
  const where = { userId: req.user.id };
  if (req.query.unread === 'true') where.read = false;
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, read: false } }),
  ]);
  res.json({ items, total, unreadCount, page, limit });
});

export const markRead = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  await prisma.notification.updateMany({
    where: { id, userId: req.user.id },
    data: { read: true, readAt: new Date() },
  });
  res.json({ ok: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true, readAt: new Date() },
  });
  res.json({ ok: true });
});

// ── Platform Analytics (for dashboards) ──────────────────
export const platformStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalInterns,
    totalArticles,
    verifiedArticles,
    totalReports,
    pendingReports,
    totalQuestions,
    totalAnnouncements,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'INTERN' } }),
    prisma.knowledgeArticle.count({ where: { status: 'PUBLISHED' } }),
    prisma.knowledgeArticle.count({ where: { status: 'PUBLISHED', verified: true } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.question.count(),
    prisma.announcement.count(),
  ]);

  // Daily logins last 7 days (from audit log)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const logins = await prisma.auditLog.findMany({
    where: { action: 'auth.login.success', createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  });
  const byDay = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  logins.forEach((l) => {
    const key = l.createdAt.toISOString().slice(0, 10);
    if (key in byDay) byDay[key] += 1;
  });

  res.json({
    totalUsers,
    activeUsers,
    totalInterns,
    totalArticles,
    verifiedArticles,
    totalReports,
    pendingReports,
    totalQuestions,
    totalAnnouncements,
    loginsByDay: Object.entries(byDay).map(([day, count]) => ({ day, count })),
  });
});

export const internPerformance = asyncHandler(async (req, res) => {
  const interns = await prisma.user.findMany({
    where: { role: 'INTERN' },
    select: {
      id: true,
      name: true,
      department: true,
      rating: true,
      avatarUrl: true,
      reports: {
        select: { status: true, score: true },
      },
      projectTasks: {
        select: { status: true },
      },
      attendances: {
        where: { date: { gte: new Date(new Date() - 30 * 86400000) } },
        select: { status: true },
      },
    },
  });

  const items = interns.map((i) => {
    const reviewed = i.reports.filter((r) => r.status === 'REVIEWED');
    const avgScore = reviewed.length ? reviewed.reduce((s, r) => s + (r.score ?? 0), 0) / reviewed.length : 0;
    const completed = i.projectTasks.filter((t) => t.status === 'DONE').length;
    const present = i.attendances.filter((a) => a.status === 'PRESENT').length;
    return {
      id: i.id,
      name: i.name,
      department: i.department,
      avatarUrl: i.avatarUrl,
      rating: i.rating,
      avgScore: Math.round(avgScore * 10) / 10,
      completedTasks: completed,
      attendanceRate: i.attendances.length ? Math.round((present / i.attendances.length) * 100) : 0,
    };
  });

  res.json({ items });
});

export default { list, markRead, markAllRead, platformStats, internPerformance };
