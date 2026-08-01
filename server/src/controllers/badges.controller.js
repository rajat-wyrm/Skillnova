// ════════════════════════════════════════════════════════════
//  Achievement Badges Controller
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { evaluateBadgesForUser, evaluateTopPerformers } from '../services/badge.service.js';

export const list = asyncHandler(async (req, res) => {
  const badges = await prisma.badge.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { awards: true } } },
  });
  res.json({ items: badges });
});

export const create = asyncHandler(async (req, res) => {
  const { name, description, icon, type, criteria } = req.body;
  const badge = await prisma.badge.create({ data: { name, description, icon, type, criteria } });
  await audit({ userId: req.user.id, action: 'badge.create', resource: 'badge', resourceId: badge.id, req });
  res.status(201).json({ badge });
});

export const update = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const existing = await prisma.badge.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Badge not found');
  const { name, description, icon, criteria, active } = req.body;
  const badge = await prisma.badge.update({
    where: { id },
    data: { name, description, icon, criteria, active },
  });
  await audit({ userId: req.user.id, action: 'badge.update', resource: 'badge', resourceId: id, req });
  res.json({ badge });
});

export const remove = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const existing = await prisma.badge.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Badge not found');
  await prisma.badge.delete({ where: { id } });
  await audit({ userId: req.user.id, action: 'badge.delete', resource: 'badge', resourceId: id, req });
  res.json({ ok: true });
});

export const myBadges = asyncHandler(async (req, res) => {
  const awards = await prisma.badgeAward.findMany({
    where: { userId: req.user.id },
    include: { badge: true },
    orderBy: { awardedAt: 'desc' },
  });
  res.json({ items: awards });
});

export const userBadges = asyncHandler(async (req, res) => {
  const userId = req.validatedParams.userId;
  const awards = await prisma.badgeAward.findMany({
    where: { userId, showcase: true },
    include: { badge: true },
    orderBy: { awardedAt: 'desc' },
  });
  res.json({ items: awards });
});

// Manual award (e.g. ADMIN grants a CUSTOM badge)
export const awardManually = asyncHandler(async (req, res) => {
  const badgeId = req.validatedParams.id;
  const { userId, note } = req.body;
  const [badge, user] = await Promise.all([
    prisma.badge.findUnique({ where: { id: badgeId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  if (!badge) throw ApiError.notFound('Badge not found');
  if (!user) throw ApiError.notFound('User not found');

  const award = await prisma.badgeAward.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    update: { note },
    create: { userId, badgeId, note },
  });
  await notify(userId, {
    type: 'badge',
    title: `New badge earned: ${badge.name}`,
    body: note || badge.description || 'Check your profile to see it.',
    link: '/badges',
  });
  await audit({ userId: req.user.id, action: 'badge.manual_award', resource: 'badgeAward', resourceId: award.id, meta: { userId, badgeId }, req });
  res.status(201).json({ award });
});

export const toggleShowcase = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const award = await prisma.badgeAward.findUnique({ where: { id } });
  if (!award) throw ApiError.notFound('Award not found');
  if (award.userId !== req.user.id) throw ApiError.forbidden('Not your badge');
  const updated = await prisma.badgeAward.update({
    where: { id },
    data: { showcase: !award.showcase },
  });
  res.json({ award: updated });
});

// Admin-triggered re-evaluation (also runs automatically after progress recompute)
export const evaluateNow = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (userId) {
    const newlyAwarded = await evaluateBadgesForUser(userId);
    return res.json({ newlyAwarded });
  }
  const topPerformers = await evaluateTopPerformers();
  res.json({ topPerformers });
});
