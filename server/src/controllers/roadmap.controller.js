// ════════════════════════════════════════════════════════════
//  Learning Roadmap Controller
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { recomputeProgress } from '../services/progress.service.js';

// ── Paths ─────────────────────────────────────────────────
export const listPaths = asyncHandler(async (req, res) => {
  const paths = await prisma.learningPath.findMany({
    orderBy: { createdAt: 'desc' },
    include: { milestones: { orderBy: { order: 'asc' } }, _count: { select: { assignments: true } } },
  });
  res.json({ items: paths });
});

export const createPath = asyncHandler(async (req, res) => {
  const { title, description, skillTags = [], milestones = [] } = req.body;
  const path = await prisma.learningPath.create({
    data: {
      title,
      description,
      skillTags,
      createdById: req.user.id,
      milestones: {
        create: milestones.map((m, i) => ({
          title: m.title,
          description: m.description,
          resourceUrl: m.resourceUrl,
          order: m.order ?? i,
        })),
      },
    },
    include: { milestones: true },
  });
  await audit({ userId: req.user.id, action: 'roadmap.path.create', resource: 'learningPath', resourceId: path.id, req });
  res.status(201).json({ path });
});

export const updatePath = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const existing = await prisma.learningPath.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Learning path not found');
  const { title, description, skillTags } = req.body;
  const path = await prisma.learningPath.update({
    where: { id },
    data: { title, description, skillTags },
  });
  await audit({ userId: req.user.id, action: 'roadmap.path.update', resource: 'learningPath', resourceId: id, req });
  res.json({ path });
});

export const deletePath = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const existing = await prisma.learningPath.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Learning path not found');
  await prisma.learningPath.delete({ where: { id } });
  await audit({ userId: req.user.id, action: 'roadmap.path.delete', resource: 'learningPath', resourceId: id, req });
  res.json({ ok: true });
});

// ── Milestones ────────────────────────────────────────────
export const addMilestone = asyncHandler(async (req, res) => {
  const pathId = req.validatedParams.id;
  const path = await prisma.learningPath.findUnique({ where: { id: pathId } });
  if (!path) throw ApiError.notFound('Learning path not found');
  const { title, description, resourceUrl, order } = req.body;
  const milestone = await prisma.learningMilestone.create({
    data: { pathId, title, description, resourceUrl, order: order ?? 0 },
  });
  res.status(201).json({ milestone });
});

export const removeMilestone = asyncHandler(async (req, res) => {
  const id = req.validatedParams.milestoneId;
  const milestone = await prisma.learningMilestone.findUnique({ where: { id } });
  if (!milestone) throw ApiError.notFound('Milestone not found');
  await prisma.learningMilestone.delete({ where: { id } });
  res.json({ ok: true });
});

// ── Assignments ───────────────────────────────────────────
export const assignPath = asyncHandler(async (req, res) => {
  const pathId = req.validatedParams.id;
  const { userId, mentorGoal } = req.body;
  const [path, user] = await Promise.all([
    prisma.learningPath.findUnique({ where: { id: pathId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  if (!path) throw ApiError.notFound('Learning path not found');
  if (!user) throw ApiError.notFound('User not found');

  const assignment = await prisma.roadmapAssignment.upsert({
    where: { userId_pathId: { userId, pathId } },
    update: { mentorGoal, assignedById: req.user.id },
    create: { userId, pathId, mentorGoal, assignedById: req.user.id },
  });

  await notify(userId, {
    type: 'roadmap',
    title: `New learning path assigned: ${path.title}`,
    body: mentorGoal || 'Check your roadmap for details.',
    link: '/roadmap',
  });
  await audit({ userId: req.user.id, action: 'roadmap.assign', resource: 'roadmapAssignment', resourceId: assignment.id, meta: { userId, pathId }, req });
  res.status(201).json({ assignment });
});

export const myRoadmap = asyncHandler(async (req, res) => {
  const assignments = await prisma.roadmapAssignment.findMany({
    where: { userId: req.user.id },
    include: {
      path: { include: { milestones: { orderBy: { order: 'asc' } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const milestoneIds = assignments.flatMap((a) => a.path.milestones.map((m) => m.id));
  const progressRows = milestoneIds.length
    ? await prisma.milestoneProgress.findMany({
        where: { userId: req.user.id, milestoneId: { in: milestoneIds } },
      })
    : [];
  const progressByMilestone = Object.fromEntries(progressRows.map((p) => [p.milestoneId, p]));

  const items = assignments.map((a) => ({
    ...a,
    path: {
      ...a.path,
      milestones: a.path.milestones.map((m) => ({
        ...m,
        completed: progressByMilestone[m.id]?.completed ?? false,
        completedAt: progressByMilestone[m.id]?.completedAt ?? null,
      })),
    },
  }));

  res.json({ items });
});

export const userRoadmap = asyncHandler(async (req, res) => {
  const userId = req.validatedParams.userId;
  const assignments = await prisma.roadmapAssignment.findMany({
    where: { userId },
    include: { path: { include: { milestones: { orderBy: { order: 'asc' } } } } },
  });
  res.json({ items: assignments });
});

export const completeMilestone = asyncHandler(async (req, res) => {
  const milestoneId = req.validatedParams.milestoneId;
  const milestone = await prisma.learningMilestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw ApiError.notFound('Milestone not found');

  const progress = await prisma.milestoneProgress.upsert({
    where: { milestoneId_userId: { milestoneId, userId: req.user.id } },
    update: { completed: true, completedAt: new Date() },
    create: { milestoneId, userId: req.user.id, completed: true, completedAt: new Date() },
  });

  // Mark the roadmap assignment IN_PROGRESS if it was NOT_STARTED
  await prisma.roadmapAssignment.updateMany({
    where: { userId: req.user.id, pathId: milestone.pathId, status: 'NOT_STARTED' },
    data: { status: 'IN_PROGRESS' },
  });

  // If all milestones in the path are complete, mark assignment COMPLETED
  const [totalMilestones, completedMilestones] = await Promise.all([
    prisma.learningMilestone.count({ where: { pathId: milestone.pathId } }),
    prisma.milestoneProgress.count({
      where: {
        userId: req.user.id,
        completed: true,
        milestone: { pathId: milestone.pathId },
      },
    }),
  ]);
  if (totalMilestones > 0 && completedMilestones >= totalMilestones) {
    await prisma.roadmapAssignment.updateMany({
      where: { userId: req.user.id, pathId: milestone.pathId },
      data: { status: 'COMPLETED' },
    });
  }

  await recomputeProgress(req.user.id);
  res.json({ progress });
});
