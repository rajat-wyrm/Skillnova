// ════════════════════════════════════════════════════════════
//  Knowledge Base Routes
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { z } from 'zod';
import * as kb from '../controllers/kb.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, requireAuth);

const idParam = z.object({ id: z.string().min(1) });

router.get('/categories', requirePermission('kb:read'), kb.listCategories);
router.post(
  '/categories',
  requirePermission('kb:create'),
  validate(
    z.object({
      name: z.string().min(2).max(80),
      description: z.string().max(300).optional(),
      icon: z.string().max(40).optional(),
      order: z.number().int().optional(),
    })
  ),
  kb.createCategory
);

router.get('/articles', requirePermission('kb:read'), validate(schemas.pagination, 'query'), kb.listArticles);
router.get('/articles/:id', requirePermission('kb:read'), validate(idParam, 'params'), kb.getArticle);
router.post(
  '/articles',
  requirePermission('kb:create'),
  validate(
    z.object({
      title: z.string().min(3).max(200),
      content: z.string().min(1),
      excerpt: z.string().max(500).optional(),
      categoryId: z.string().cuid(),
      tags: z.array(z.string().max(40)).max(10).optional(),
      status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
    })
  ),
  kb.createArticle
);
router.patch(
  '/articles/:id',
  requirePermission('kb:update'),
  validate(idParam, 'params'),
  validate(
    z.object({
      title: z.string().min(3).max(200).optional(),
      content: z.string().min(1).optional(),
      excerpt: z.string().max(500).optional(),
      categoryId: z.string().cuid().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    })
  ),
  kb.updateArticle
);
router.patch(
  '/articles/:id/verify',
  requirePermission('kb:verify'),
  validate(idParam, 'params'),
  validate(z.object({ verified: z.boolean() })),
  kb.verifyArticle
);
router.delete('/articles/:id', requirePermission('kb:delete'), validate(idParam, 'params'), kb.deleteArticle);
router.post(
  '/articles/:id/feedback',
  requirePermission('kb:read'),
  validate(idParam, 'params'),
  validate(z.object({ helpful: z.boolean(), comment: z.string().max(500).optional() })),
  kb.submitFeedback
);

export default router;
