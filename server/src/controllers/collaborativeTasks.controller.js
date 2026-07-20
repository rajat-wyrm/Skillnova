// ════════════════════════════════════════════════════════════
//  Collaborative Tasks Controller
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';

// 1. Create a Collaborative Task
export const createTask = asyncHandler(async (req, res) => {
  const { teamId, title, description, status, assigneeIds = [] } = req.body;
  const creatorId = req.user.id;

  // Verify team exists
  const teamExists = await prisma.team.findUnique({ where: { id: teamId } });
  if (!teamExists) throw ApiError.notFound('Team not found');

  const task = await prisma.collaborativeTask.create({
    data: {
      teamId,
      title,
      description,
      status: status || 'TODO',
      creatorId,
      assignees: {
        connect: assigneeIds.map((id) => ({ id })),
      },
    },
    include: {
      assignees: { select: { id: true, name: true, avatarUrl: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  await audit({ userId: creatorId, action: 'collab_task.create', resource: 'task', resourceId: task.id, req });
  res.status(201).json({ task });
});

// 2. Get All Tasks for a Specific Team
export const getTeamTasks = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const teamExists = await prisma.team.findUnique({ where: { id: teamId } });
  if (!teamExists) throw ApiError.notFound('Team not found');

  const tasks = await prisma.collaborativeTask.findMany({
    where: { teamId },
    include: {
      assignees: { select: { id: true, name: true, avatarUrl: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ tasks });
});

// 3. Update Task Status
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const task = await prisma.collaborativeTask.findUnique({ where: { id } });
  if (!task) throw ApiError.notFound('Task not found');

  const updatedTask = await prisma.collaborativeTask.update({
    where: { id },
    data: { status },
    include: {
      assignees: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  await audit({ userId: req.user.id, action: 'collab_task.update_status', resource: 'task', resourceId: id, meta: { status }, req });
  res.json({ task: updatedTask });
});

// 4. Assign / Reassign Users to a Task
export const assignUsersToTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assigneeIds } = req.body;

  const task = await prisma.collaborativeTask.findUnique({ where: { id } });
  if (!task) throw ApiError.notFound('Task not found');

  const updatedTask = await prisma.collaborativeTask.update({
    where: { id },
    data: {
      assignees: {
        set: assigneeIds.map((userId) => ({ id: userId })),
      },
    },
    include: {
      assignees: { select: { id: true, name: true, avatarUrl: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  await audit({ userId: req.user.id, action: 'collab_task.assign_users', resource: 'task', resourceId: id, meta: { assigneeIds }, req });
  res.json({ task: updatedTask });
});

// 5. Get All Teams for the User/Admin
export const getTeams = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let teams;
  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
    teams = await prisma.team.findMany({
      include: {
        members: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
      orderBy: { name: 'asc' },
    });
  } else {
    teams = await prisma.team.findMany({
      where: {
        members: { some: { id: userId } },
      },
      include: {
        members: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  res.json({ teams });
});

export default {
  createTask,
  getTeamTasks,
  updateTaskStatus,
  assignUsersToTask,
  getTeams,
};
