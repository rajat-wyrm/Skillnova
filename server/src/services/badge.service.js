// ════════════════════════════════════════════════════════════
//  Badge rule engine
//  Evaluates a Badge's `criteria` JSON against a user's current
//  InternshipProgress + related counts, and auto-awards badges
//  the user newly qualifies for. Safe to call repeatedly —
//  awarding is idempotent via the (userId, badgeId) unique index.
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { notify } from './notification.service.js';
import { audit } from './audit.service.js';

/**
 * criteria shape (all optional, ANDed together):
 * {
 *   "metric": "attendancePct" | "taskPct" | "learningPct" | "overallPct",
 *   "gte": 90,
 *   "projectsCompleted": { "gte": 1 },
 *   "topPerformerRank": { "lte": 3 }   // computed externally, see evaluateTopPerformers
 * }
 */
function meetsMetricCriteria(progress, criteria) {
  if (!criteria) return false;
  if (criteria.metric && typeof criteria.gte === 'number') {
    const value = progress[criteria.metric];
    if (typeof value !== 'number' || value < criteria.gte) return false;
  }
  return true;
}

async function meetsProjectsCriteria(userId, criteria) {
  if (!criteria?.projectsCompleted?.gte) return true;
  const count = await prisma.projectTask.count({
    where: { assigneeId: userId, status: 'DONE' },
  });
  return count >= criteria.projectsCompleted.gte;
}

/**
 * Evaluate every active badge against one user's current progress
 * and award any newly-qualified ones. Returns the list of newly
 * awarded badges (empty array if none).
 */
export async function evaluateBadgesForUser(userId) {
  const [progress, badges, existingAwards] = await Promise.all([
    prisma.internshipProgress.findUnique({ where: { userId } }),
    prisma.badge.findMany({ where: { active: true } }),
    prisma.badgeAward.findMany({ where: { userId }, select: { badgeId: true } }),
  ]);
  if (!progress) return [];

  const alreadyAwarded = new Set(existingAwards.map((a) => a.badgeId));
  const newlyAwarded = [];

  for (const badge of badges) {
    if (alreadyAwarded.has(badge.id)) continue;
    const c = badge.criteria || {};

    const metricOk = c.metric ? meetsMetricCriteria(progress, c) : true;
    const projectsOk = await meetsProjectsCriteria(userId, c);
    if (!metricOk || !projectsOk) continue;

    const award = await prisma.badgeAward.create({
      data: { userId, badgeId: badge.id },
      include: { badge: true },
    });
    newlyAwarded.push(award);

    await notify(userId, {
      type: 'badge',
      title: `New badge earned: ${badge.name}`,
      body: badge.description || 'Check your profile to see it.',
      link: '/badges',
    });
    await audit({
      userId,
      action: 'badge.auto_award',
      resource: 'badgeAward',
      resourceId: award.id,
      meta: { badgeId: badge.id, badgeName: badge.name },
    });
  }

  return newlyAwarded;
}

/**
 * Recompute TOP_PERFORMER badges across all interns based on
 * overallPct ranking. Intended to be run on a schedule (e.g. weekly)
 * or triggered manually by an admin, not on every progress update.
 */
export async function evaluateTopPerformers(topN = 3) {
  const badge = await prisma.badge.findFirst({
    where: { type: 'TOP_PERFORMER', active: true },
  });
  if (!badge) return [];

  const top = await prisma.internshipProgress.findMany({
    orderBy: { overallPct: 'desc' },
    take: topN,
    where: { overallPct: { gt: 0 } },
  });

  const awarded = [];
  for (const p of top) {
    const exists = await prisma.badgeAward.findUnique({
      where: { userId_badgeId: { userId: p.userId, badgeId: badge.id } },
    });
    if (exists) continue;
    const award = await prisma.badgeAward.create({
      data: { userId: p.userId, badgeId: badge.id },
    });
    awarded.push(award);
    await notify(p.userId, {
      type: 'badge',
      title: `New badge earned: ${badge.name}`,
      body: 'You ranked among the top performers this cycle.',
      link: '/badges',
    });
  }
  return awarded;
}

export default { evaluateBadgesForUser, evaluateTopPerformers };
