// ════════════════════════════════════════════════════════════
//  Users Routes
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { z } from 'zod';
import * as users from '../controllers/users.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, requireAuth);

const idParam = z.object({ id: z.string().cuid() });

router.get(
  '/',
  requirePermission('users:read'),
  validate(schemas.pagination, 'query'),
  users.list
);
router.get('/stats', requirePermission('users:read'), users.stats);
router.get('/:id', requirePermission('users:read'), validate(idParam, 'params'), users.getById);
router.post(
  '/',
  requirePermission('users:create'),
  validate(
    z.object({
      email: schemas.email,
      password: schemas.password,
      name: z.string().min(2).max(80),
      role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN']).default('INTERN'),
      department: z.string().max(80).optional().nullable(),
    })
  ),
  users.create
);
router.patch(
  '/:id',
  requirePermission('users:update'),
  validate(idParam, 'params'),
  validate(
    z.object({
      name: z.string().min(2).max(80).optional(),
      department: z.string().max(80).optional().nullable(),
      college: z.string().max(120).optional().nullable(),
      yearOfStudy: z.string().max(40).optional().nullable(),
      dateOfBirth: z.coerce.date().optional().nullable(),
      linkedinUrl: z.string().url().optional().nullable(),
      skills: z.string().max(500).optional().nullable(),
      avatarUrl: z.string().url().optional().nullable(),
      rating: z.coerce.number().min(0).max(10).optional(),
    })
  ),
  users.update
);
router.patch(
  '/:id/role',
  requirePermission('users:role:change'),
  validate(idParam, 'params'),
  validate(z.object({ role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN']) })),
  users.changeRole
);
router.patch(
  '/:id/status',
  requirePermission('users:update'),
  validate(idParam, 'params'),
  validate(z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']) })),
  users.changeStatus
);
router.delete('/:id', requirePermission('users:delete'), validate(idParam, 'params'), users.remove);

export default router;
