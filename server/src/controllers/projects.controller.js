// ════════════════════════════════════════════════════════════
//  Projects & Tasks Controller
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { emitToRoom } from '../sockets/index.js';
import { recordActivity } from '../services/streak.service.js';

// Local schemas (validators live in routes; kept here for documentation & reuse)
const _projectSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().max(2000).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const _taskSchema = z.object({
  projectId: z.string().cuid(),
  assigneeId: z.string().cuid().optional().nullable(),
  title: z.string().trim().min(3).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.coerce.date().optional(),
});

export const listProjects = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'createdAt', order } = req.validatedQuery;
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { tasks: true, interns: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);
  res.json({ items, total, page, limit });
});

export const getProject = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { createdAt: 'desc' },
        include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
      },
      interns: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } }, mentor: { select: { id: true, name: true } } },
      },
    },
  });
  if (!project) throw ApiError.notFound();
  res.json({ project });
});

export const createProject = asyncHandler(async (req, res) => {
  const data = req.body;
  const project = await prisma.project.create({
    data: { ...data, createdById: req.user.id },
  });
  await audit({ userId: req.user.id, action: 'project.create', resource: 'project', resourceId: project.id, req });
  res.status(201).json({ project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const project = await prisma.project.update({ where: { id }, data: req.body });
  await audit({ userId: req.user.id, action: 'project.update', resource: 'project', resourceId: id, req });
  res.json({ project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  await prisma.project.delete({ where: { id } });
  await audit({ userId: req.user.id, action: 'project.delete', resource: 'project', resourceId: id, req });
  res.json({ ok: true });
});

// ── Tasks ──────────────────────────────────────────────────
export const listTasks = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'dueDate', order } = req.validatedQuery;
  const where = {};
  if (req.user.role === 'INTERN') where.assigneeId = req.user.id;
  else if (req.query.assigneeId) where.assigneeId = req.query.assigneeId;
  if (req.query.projectId) where.projectId = req.query.projectId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.priority) where.priority = req.query.priority;

  const [items, total] = await Promise.all([
    prisma.projectTask.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } }, project: { select: { id: true, name: true } } },
    }),
    prisma.projectTask.count({ where }),
  ]);
  res.json({ items, total, page, limit });
});

export const createTask = asyncHandler(async (req, res) => {
  const data = req.body;
  const task = await prisma.projectTask.create({ data });
  await audit({ userId: req.user.id, action: 'task.create', resource: 'task', resourceId: task.id, req });
  if (task.assigneeId) {
    await notify(task.assigneeId, {
      type: 'task',
      title: 'New task assigned',
      body: task.title,
      link: `/projects/${task.projectId}/tasks/${task.id}`,
    });
  }
  res.status(201).json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const task = await prisma.projectTask.findUnique({ where: { id } });
  if (!task) throw ApiError.notFound();
  // Interns can only update status on their own tasks
  if (req.user.role === 'INTERN') {
    if (task.assigneeId !== req.user.id) throw ApiError.forbidden();
    if (Object.keys(req.body).some((k) => !['status'].includes(k))) {
      throw ApiError.forbidden('Interns can only update task status');
    }
  }
  const update = { ...req.body };
  if (req.body.status === 'DONE' && task.status !== 'DONE') {
    update.completedAt = new Date();
  }
  const updated = await prisma.projectTask.update({ where: { id }, data: update });
  await audit({ userId: req.user.id, action: 'task.update', resource: 'task', resourceId: id, meta: req.body, req });
  emitToRoom(`project:${updated.projectId}`, 'task:updated', { projectId: updated.projectId, taskId: updated.id, task: updated });
  emitToRoom(`role:MENTOR`, 'dashboard:refresh', {});
  emitToRoom(`role:ADMIN`, 'dashboard:refresh', {});
  emitToRoom(`role:SUPER_ADMIN`, 'dashboard:refresh', {});
  if (req.body.status === 'DONE' && task.status !== 'DONE' && updated.assigneeId) {
    await recordActivity(updated.assigneeId);
  }
  res.json({ task: updated });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  await prisma.projectTask.delete({ where: { id } });
  await audit({ userId: req.user.id, action: 'task.delete', resource: 'task', resourceId: id, req });
  res.json({ ok: true });
});

export default {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
};
