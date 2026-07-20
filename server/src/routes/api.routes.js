// ════════════════════════════════════════════════════════════
//  Reports, Announcements, Q&A, Attendance, Projects, AI
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { z } from 'zod';
import * as reports from '../controllers/reports.controller.js';
import * as announcements from '../controllers/announcements.controller.js';
import * as qa from '../controllers/qa.controller.js';
import * as attendance from '../controllers/attendance.controller.js';
import * as projects from '../controllers/projects.controller.js';
import * as ai from '../controllers/ai.controller.js';
import * as notif from '../controllers/notifications.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { validate, schemas } from '../middleware/validate.js';
import collaborativeTasksRouter from './collaborativeTasks.routes.js';

const api = Router();
api.use(authenticate, requireAuth);

const idParam = z.object({ id: z.string().cuid() });

// ── Reports ───────────────────────────────────────────────
api.get(
  '/reports',
  requirePermission('reports:read'),
  validate(schemas.pagination, 'query'),
  reports.list
);
api.get('/reports/stats', requirePermission('reports:read'), reports.stats);
api.get('/reports/:id', requirePermission('reports:read'), validate(idParam, 'params'), reports.getById);
api.post(
  '/reports',
  requirePermission('reports:create'),
  validate(
    z.object({
      title: z.string().min(3).max(200),
      content: z.string().min(1).optional(),
      fileUrl: z.string().url().optional(),
      weekNumber: z.number().int().min(1).max(104).optional(),
    })
  ),
  reports.create
);
api.patch(
  '/reports/:id',
  requirePermission('reports:update'),
  validate(idParam, 'params'),
  validate(
    z.object({
      title: z.string().min(3).max(200).optional(),
      content: z.string().optional(),
      fileUrl: z.string().url().optional().nullable(),
      weekNumber: z.number().int().min(1).max(104).optional(),
    })
  ),
  reports.update
);
api.patch(
  '/reports/:id/review',
  requirePermission('reports:review'),
  validate(idParam, 'params'),
  validate(
    z.object({
      status: z.enum(['PENDING', 'REVIEWED', 'REJECTED']).default('REVIEWED'),
      score: z.number().min(0).max(10).optional(),
      feedback: z.string().max(2000).optional(),
    })
  ),
  reports.review
);
api.delete('/reports/:id', requirePermission('reports:delete'), validate(idParam, 'params'), reports.remove);

// ── Announcements ─────────────────────────────────────────
api.get(
  '/announcements',
  requirePermission('announcements:read'),
  validate(schemas.pagination, 'query'),
  announcements.list
);
api.get('/announcements/:id', requirePermission('announcements:read'), validate(idParam, 'params'), announcements.getById);
api.post(
  '/announcements',
  requirePermission('announcements:create'),
  validate(
    z.object({
      title: z.string().min(3).max(200),
      body: z.string().min(1).max(5000),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
      pinned: z.boolean().default(false),
      expiresAt: z.coerce.date().optional(),
    })
  ),
  announcements.create
);
api.patch(
  '/announcements/:id',
  requirePermission('announcements:update'),
  validate(idParam, 'params'),
  validate(
    z.object({
      title: z.string().min(3).max(200).optional(),
      body: z.string().min(1).max(5000).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      pinned: z.boolean().optional(),
      expiresAt: z.coerce.date().optional(),
    })
  ),
  announcements.update
);
api.patch('/announcements/:id/pin', requirePermission('announcements:update'), validate(idParam, 'params'), announcements.togglePin);
api.post('/announcements/:id/read', requirePermission('announcements:read'), validate(idParam, 'params'), announcements.markRead);
api.delete('/announcements/:id', requirePermission('announcements:delete'), validate(idParam, 'params'), announcements.remove);

// ── Q&A ───────────────────────────────────────────────────
api.get('/qa/questions', requirePermission('qa:read'), validate(schemas.pagination, 'query'), qa.listQuestions);
api.get('/qa/questions/:id', requirePermission('qa:read'), validate(idParam, 'params'), qa.getQuestion);
api.post(
  '/qa/questions',
  requirePermission('qa:create'),
  validate(
    z.object({
      title: z.string().min(8).max(200),
      body: z.string().min(10).max(8000),
      category: z.string().max(40).optional(),
    })
  ),
  qa.createQuestion
);
api.post(
  '/qa/questions/:id/answers',
  requirePermission('qa:create'),
  validate(idParam, 'params'),
  validate(z.object({ body: z.string().min(2).max(8000) })),
  qa.createAnswer
);
api.post(
  '/qa/upvote',
  requirePermission('qa:create'),
  validate(z.object({ type: z.enum(['question', 'answer']), id: z.string().cuid() })),
  qa.upvote
);
api.post('/qa/answers/:id/accept', requirePermission('qa:update'), validate(idParam, 'params'), qa.acceptAnswer);

// ── Attendance ────────────────────────────────────────────
api.get('/attendance', requirePermission('attendance:read'), validate(schemas.pagination, 'query'), attendance.list);
api.get('/attendance/summary', requirePermission('attendance:self'), attendance.summary);
api.post(
  '/attendance/mark',
  requirePermission('attendance:mark'),
  validate(
    z.object({
      userId: z.string().cuid(),
      date: z.coerce.date().optional(),
      status: z.enum(['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'LATE']).default('PRESENT'),
      notes: z.string().max(300).optional(),
      checkIn: z.coerce.date().optional(),
      checkOut: z.coerce.date().optional(),
    })
  ),
  attendance.mark
);
api.post(
  '/attendance/check',
  requirePermission('attendance:self'),
  validate(z.object({ status: z.enum(['PRESENT', 'LEAVE']).default('PRESENT'), notes: z.string().max(300).optional() })),
  attendance.checkInOut
);

// ── Projects ──────────────────────────────────────────────
api.get('/projects', requirePermission('projects:read'), validate(schemas.pagination, 'query'), projects.listProjects);
api.get('/projects/:id', requirePermission('projects:read'), validate(idParam, 'params'), projects.getProject);
api.post(
  '/projects',
  requirePermission('projects:create'),
  validate(
    z.object({
      name: z.string().min(3).max(120),
      description: z.string().max(2000).optional(),
      status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    })
  ),
  projects.createProject
);
api.patch(
  '/projects/:id',
  requirePermission('projects:update'),
  validate(idParam, 'params'),
  validate(
    z.object({
      name: z.string().min(3).max(120).optional(),
      description: z.string().max(2000).optional(),
      status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    })
  ),
  projects.updateProject
);
api.delete('/projects/:id', requirePermission('projects:delete'), validate(idParam, 'params'), projects.deleteProject);

api.get('/tasks', requirePermission('tasks:read'), validate(schemas.pagination, 'query'), projects.listTasks);
api.post(
  '/tasks',
  requirePermission('tasks:create'),
  validate(
    z.object({
      projectId: z.string().cuid(),
      assigneeId: z.string().cuid().optional().nullable(),
      title: z.string().min(3).max(200),
      description: z.string().max(2000).optional(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).default('TODO'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
      dueDate: z.coerce.date().optional(),
    })
  ),
  projects.createTask
);
api.patch(
  '/tasks/:id',
  requirePermission('tasks:update'),
  validate(idParam, 'params'),
  validate(
    z.object({
      title: z.string().min(3).max(200).optional(),
      description: z.string().max(2000).optional(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      dueDate: z.coerce.date().optional(),
      assigneeId: z.string().cuid().nullable().optional(),
    })
  ),
  projects.updateTask
);
api.delete('/tasks/:id', requirePermission('tasks:delete'), validate(idParam, 'params'), projects.deleteTask);

// ── AI Assistant ──────────────────────────────────────────
api.post(
  '/ai/chat',
  requirePermission('ai:use'),
  validate(
    z.object({
      message: z.string().min(1).max(4000),
      sessionId: z.string().cuid().optional(),
    })
  ),
  ai.chat
);
api.post(
  '/ai/chat/stream',
  requirePermission('ai:use'),
  validate(
    z.object({
      message: z.string().min(1).max(4000),
      sessionId: z.string().cuid().optional(),
    })
  ),
  ai.streamChat
);
api.get('/ai/sessions', requirePermission('ai:use'), ai.listSessions);
api.get('/ai/sessions/:id', requirePermission('ai:use'), validate(idParam, 'params'), ai.getSession);
api.delete('/ai/sessions/:id', requirePermission('ai:use'), validate(idParam, 'params'), ai.deleteSession);

// ── Notifications ─────────────────────────────────────────
api.get('/notifications', validate(schemas.pagination, 'query'), notif.list);
api.post('/notifications/:id/read', validate(idParam, 'params'), notif.markRead);
api.post('/notifications/read-all', notif.markAllRead);

// ── Analytics ─────────────────────────────────────────────
api.get('/analytics/platform', requirePermission('users:read'), notif.platformStats);
api.get('/analytics/interns', requirePermission('users:read'), notif.internPerformance);
api.get('/analytics/leaderboard', notif.leaderboard);

// ── Collaborative Tasks ───────────────────────────────────
api.use('/collab-tasks', collaborativeTasksRouter);

export default api;
