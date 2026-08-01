// ════════════════════════════════════════════════════════════
//  Phase 1 routes — Learning Roadmap, Achievement Badges,
//  Internship Completion Tracker
//
//  Mounted at /api/v1 in app.js, alongside the existing
//  apiRoutes/featuresRoutes/kbRoutes routers. Uses the same
//  authenticate + requireAuth + csrfProtection + requirePermission
//  pattern as the rest of the codebase.
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { z } from 'zod';
import * as roadmap from '../controllers/roadmap.controller.js';
import * as badges from '../controllers/badges.controller.js';
import * as progress from '../controllers/progress.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { requirePermission, requireRole } from '../middleware/rbac.js';
import { validate, schemas } from '../middleware/validate.js';

const api = Router();
api.use(authenticate, requireAuth);

const idParam = z.object({ id: z.string().cuid() });
const milestoneIdParam = z.object({ id: z.string().cuid(), milestoneId: z.string().cuid() });
const userIdParam = z.object({ userId: z.string().cuid() });

// ── Learning Roadmap ──────────────────────────────────────
const pathCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  skillTags: z.array(z.string().max(50)).max(20).default([]),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        resourceUrl: z.string().url().optional(),
        order: z.number().int().min(0).optional(),
      })
    )
    .max(50)
    .default([]),
});
const pathUpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  skillTags: z.array(z.string().max(50)).max(20).optional(),
});
const milestoneCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  resourceUrl: z.string().url().optional(),
  order: z.number().int().min(0).optional(),
});
const assignSchema = z.object({
  userId: z.string().cuid(),
  mentorGoal: z.string().max(500).optional(),
});

api.get('/roadmap', requirePermission('projects:read'), roadmap.listPaths);
api.post('/roadmap', requireRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), validate(pathCreateSchema), roadmap.createPath);
api.patch('/roadmap/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), validate(idParam, 'params'), validate(pathUpdateSchema), roadmap.updatePath);
api.delete('/roadmap/:id', requireRole('SUPER_ADMIN', 'ADMIN'), validate(idParam, 'params'), roadmap.deletePath);

api.post('/roadmap/:id/milestones', requireRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), validate(idParam, 'params'), validate(milestoneCreateSchema), roadmap.addMilestone);
api.delete('/roadmap/:id/milestones/:milestoneId', requireRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), validate(milestoneIdParam, 'params'), roadmap.removeMilestone);

api.post('/roadmap/:id/assign', requireRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), validate(idParam, 'params'), validate(assignSchema), roadmap.assignPath);
api.get('/roadmap/mine', roadmap.myRoadmap);
api.get('/roadmap/user/:userId', requireRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), validate(userIdParam, 'params'), roadmap.userRoadmap);
api.patch('/roadmap/milestones/:milestoneId/complete', validate(z.object({ milestoneId: z.string().cuid() }), 'params'), roadmap.completeMilestone);

// ── Badges ─────────────────────────────────────────────────
const badgeCreateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  icon: z.string().max(100).optional(),
  type: z.enum(['ATTENDANCE', 'PROJECT_COMPLETION', 'SKILL_MASTERY', 'TOP_PERFORMER', 'CUSTOM']),
  criteria: z.record(z.any()).optional(),
});
const badgeUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(100).optional(),
  criteria: z.record(z.any()).optional(),
  active: z.boolean().optional(),
});
const awardManualSchema = z.object({
  userId: z.string().cuid(),
  note: z.string().max(300).optional(),
});
const evaluateSchema = z.object({ userId: z.string().cuid().optional() });

api.get('/badges', badges.list);
api.post('/badges', requireRole('SUPER_ADMIN', 'ADMIN'), validate(badgeCreateSchema), badges.create);
api.patch('/badges/:id', requireRole('SUPER_ADMIN', 'ADMIN'), validate(idParam, 'params'), validate(badgeUpdateSchema), badges.update);
api.delete('/badges/:id', requireRole('SUPER_ADMIN', 'ADMIN'), validate(idParam, 'params'), badges.remove);
api.get('/badges/mine', badges.myBadges);
api.get('/badges/user/:userId', validate(userIdParam, 'params'), badges.userBadges);
api.post('/badges/:id/award', requireRole('SUPER_ADMIN', 'ADMIN'), validate(idParam, 'params'), validate(awardManualSchema), badges.awardManually);
api.patch('/badges/award/:id/showcase', validate(idParam, 'params'), badges.toggleShowcase);
api.post('/badges/evaluate', requireRole('SUPER_ADMIN', 'ADMIN'), validate(evaluateSchema), badges.evaluateNow);

// ── Internship Completion Tracker ────────────────────────────
api.get('/progress/mine', progress.myProgress);
api.get('/progress/list', requireRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), validate(schemas.pagination, 'query'), progress.listProgress);
api.get('/progress/:userId', requireRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), validate(userIdParam, 'params'), progress.userProgress);
api.post('/progress/:userId/recompute', requireRole('SUPER_ADMIN', 'ADMIN'), validate(userIdParam, 'params'), progress.recompute);
api.post('/progress/recompute-all', requireRole('SUPER_ADMIN', 'ADMIN'), progress.recomputeAllHandler);

export { api };
export default api;
