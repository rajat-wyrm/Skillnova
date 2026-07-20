// ════════════════════════════════════════════════════════════
//  Notifications Controller + Analytics
//  Hot endpoints cached in-memory for sub-ms response
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { lru } from '../utils/lru.js';
import { getEffectiveStreak } from '../services/streak.service.js';

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

// ── Platform Analytics (hot path — cached 60s) ─────────────
export const platformStats = asyncHandler(async (req, res) => {
  const stats = await lru.wrap('analytics:platform', 60, async () => {
    const [
      totalUsers, activeUsers, totalInterns, totalArticles,
      verifiedArticles, totalReports, pendingReports, totalQuestions, totalAnnouncements,
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

    return {
      totalUsers, activeUsers, totalInterns, totalArticles,
      verifiedArticles, totalReports, pendingReports, totalQuestions, totalAnnouncements,
      loginsByDay: Object.entries(byDay).map(([day, count]) => ({ day, count })),
    };
  });
  res.json(stats);
});

export const internPerformance = asyncHandler(async (req, res) => {
  const cacheKey = `analytics:interns:${req.query.userId || 'all'}`;
  const items = await lru.wrap(cacheKey, 30, async () => {
    const interns = await prisma.user.findMany({
      where: { role: 'INTERN' },
      select: {
        id: true, name: true, department: true, rating: true, avatarUrl: true,
        currentStreak: true, longestStreak: true, lastActivityAt: true,
        reports: { select: { status: true, score: true } },
        projectTasks: { select: { status: true } },
        attendances: {
          where: { date: { gte: new Date(new Date() - 30 * 86400000) } },
          select: { status: true },
        },
      },
    });
    return interns.map((i) => {
      const reviewed = i.reports.filter((r) => r.status === 'REVIEWED');
      const avgScore = reviewed.length ? reviewed.reduce((s, r) => s + (r.score ?? 0), 0) / reviewed.length : 0;
      const completed = i.projectTasks.filter((t) => t.status === 'DONE').length;
      const present = i.attendances.filter((a) => a.status === 'PRESENT').length;
      return {
        id: i.id, name: i.name, department: i.department, avatarUrl: i.avatarUrl, rating: i.rating,
        avgScore: Math.round(avgScore * 10) / 10, completedTasks: completed,
        attendanceRate: i.attendances.length ? Math.round((present / i.attendances.length) * 100) : 0,
        currentStreak: getEffectiveStreak(i),
        longestStreak: i.longestStreak,
        lastActivityAt: i.lastActivityAt,
      };
    });
  });
  res.json({ items });
});

export const leaderboard = asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:leaderboard';
  const list = await lru.wrap(cacheKey, 10, async () => {
    const interns = await prisma.user.findMany({
      where: { role: 'INTERN', status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        department: true,
        avatarUrl: true,
        currentStreak: true,
        longestStreak: true,
        lastActivityAt: true,
      },
    });

    const mapped = interns.map((u) => {
      const eff = getEffectiveStreak(u);
      return {
        id: u.id,
        name: u.name,
        department: u.department,
        avatarUrl: u.avatarUrl,
        currentStreak: eff,
        longestStreak: u.longestStreak,
        lastActivityAt: u.lastActivityAt,
      };
    });

    mapped.sort((a, b) => {
      if (b.currentStreak !== a.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }
      if (b.longestStreak !== a.longestStreak) {
        return b.longestStreak - a.longestStreak;
      }
      return a.name.localeCompare(b.name);
    });

    return mapped;
  });

  res.json({ items: list });
});

export default { list, markRead, markAllRead, platformStats, internPerformance, leaderboard };

