// ════════════════════════════════════════════════════════════
//  Collaborative Tasks Routes
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { z } from 'zod';
import * as collabTasks from '../controllers/collaborativeTasks.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, requireAuth);

const idParam = z.object({ id: z.string().cuid() });
const teamIdParam = z.object({ teamId: z.string().cuid() });

// ── Validation Schemas ──────────────────────────────────────────

const createTaskSchema = z.object({
  teamId: z.string().cuid(),
  title: z.string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title must not be empty')
    .max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE'], {
    errorMap: () => ({ message: "Status must be either 'TODO', 'IN_PROGRESS', or 'DONE'" })
  }).default('TODO'),
  assigneeIds: z.array(z.string().cuid()).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});

const assignUsersSchema = z.object({
  assigneeIds: z.array(z.string().cuid()),
});

// ── Route Bindings ──────────────────────────────────────────────

router.post(
  '/',
  validate(createTaskSchema, 'body'),
  collabTasks.createTask
);

router.get(
  '/teams',
  collabTasks.getTeams
);

router.get(
  '/team/:teamId',
  validate(teamIdParam, 'params'),
  collabTasks.getTeamTasks
);

router.patch(
  '/:id/status',
  validate(idParam, 'params'),
  validate(updateStatusSchema, 'body'),
  collabTasks.updateTaskStatus
);

router.put(
  '/:id/assignees',
  validate(idParam, 'params'),
  validate(assignUsersSchema, 'body'),
  collabTasks.assignUsersToTask
);

export default router;
