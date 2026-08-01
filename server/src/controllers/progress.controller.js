// ════════════════════════════════════════════════════════════
//  Internship Completion Tracker Controller
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { recomputeProgress, recomputeAll } from '../services/progress.service.js';

export const myProgress = asyncHandler(async (req, res) => {
  let progress = await prisma.internshipProgress.findUnique({ where: { userId: req.user.id } });
  if (!progress) progress = await recomputeProgress(req.user.id);
  res.json({ progress });
});

export const userProgress = asyncHandler(async (req, res) => {
  const userId = req.validatedParams.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  let progress = await prisma.internshipProgress.findUnique({ where: { userId } });
  if (!progress) progress = await recomputeProgress(userId);
  res.json({ progress });
});

export const listProgress = asyncHandler(async (req, res) => {
  const { page, limit } = req.validatedQuery;
  const [items, total] = await Promise.all([
    prisma.internshipProgress.findMany({
      orderBy: { overallPct: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, department: true, avatarUrl: true } } },
    }),
    prisma.internshipProgress.count(),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const recompute = asyncHandler(async (req, res) => {
  const userId = req.validatedParams.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  const progress = await recomputeProgress(userId);
  await audit({ userId: req.user.id, action: 'progress.recompute', resource: 'internshipProgress', resourceId: progress.id, meta: { targetUserId: userId }, req });
  res.json({ progress });
});

export const recomputeAllHandler = asyncHandler(async (req, res) => {
  const results = await recomputeAll();
  await audit({ userId: req.user.id, action: 'progress.recompute_all', resource: 'internshipProgress', meta: { count: results.length }, req });
  res.json({ count: results.length });
});
