import { asyncHandler } from '../utils/asyncHandler.js';
import * as gamificationService from '../services/gamification.service.js';
import prisma from '../utils/prisma.js';

export const getStatus = asyncHandler(async (req, res) => {
  const status = await gamificationService.getGamificationStatus(req.user.id);
  res.json(status);
});

export const getAllBadges = asyncHandler(async (req, res) => {
  const badges = await prisma.badge.findMany();
  const userBadges = await prisma.userBadge.findMany({
    where: { userId: req.user.id },
    select: { badgeId: true, unlockedAt: true }
  });
  
  const userUnlockedMap = new Map(userBadges.map(ub => [ub.badgeId, ub.unlockedAt]));
  
  const results = badges.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    xpReward: b.xpReward,
    requirementType: b.requirementType,
    requirementValue: b.requirementValue,
    unlocked: userUnlockedMap.has(b.id),
    unlockedAt: userUnlockedMap.get(b.id) || null
  }));
  
  res.json({ badges: results });
});
