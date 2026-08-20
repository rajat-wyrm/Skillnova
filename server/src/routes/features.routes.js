// ════════════════════════════════════════════════════════════
//  Feature routes — files, webhooks, preferences, exports, meetings
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { z } from 'zod';
import * as files from '../controllers/files.controller.js';
import * as webhooks from '../controllers/webhooks.controller.js';
import * as preferences from '../controllers/preferences.controller.js';
import * as exports from '../controllers/exports.controller.js';
import { authenticate, requireAuth, csrfProtection } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { rateLimitMiddleware } from '../utils/cache.js';
import { upload } from '../utils/upload.js';
import { validate } from '../middleware/validate.js';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';

const idParam = z.object({ id: z.string().min(1) });

// ════════════════════════════════════════════════════════════
//  PUBLIC sub-router (file download via signed token)
// ════════════════════════════════════════════════════════════
const publicApi = Router();
publicApi.get('/files/:id/download', validate(idParam, 'params'), files.downloadFile);

// ════════════════════════════════════════════════════════════
//  AUTHENTICATED sub-router (everything else)
// ════════════════════════════════════════════════════════════
const api = Router();
api.use(authenticate, requireAuth);

// ── Files ──────────────────────────────────────────────────
// Upload: rate-limited, multer, CSRF-exempt (multipart can't easily send custom header)
api.post(
  '/files',
  rateLimitMiddleware({ name: 'upload', windowSec: 60, max: 30 }),
  upload.single('file'),
  files.uploadFile
);
api.get('/files', files.listFiles);
api.get('/files/:id', validate(idParam, 'params'), files.getFile);
api.get('/files/:id/url', validate(idParam, 'params'), files.signFile);
api.delete('/files/:id', csrfProtection, validate(idParam, 'params'), files.deleteFile);

// ── Webhooks ──────────────────────────────────────────────
const webhookCreateSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  enabled: z.boolean().default(true),
});

api.get('/webhooks/events', webhooks.events);
api.get('/webhooks', webhooks.list);
api.post('/webhooks', csrfProtection, validate(webhookCreateSchema), webhooks.create);
api.patch('/webhooks/:id', csrfProtection, validate(idParam, 'params'), webhooks.update);
api.delete('/webhooks/:id', csrfProtection, validate(idParam, 'params'), webhooks.remove);
api.get('/webhooks/:id/deliveries', validate(idParam, 'params'), webhooks.deliveries);
api.post('/webhooks/:id/test', csrfProtection, validate(idParam, 'params'), webhooks.test);

// ── Notification preferences ──────────────────────────────
const prefSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  typePrefs: z.record(z.boolean()).optional(),
  quietFrom: z.string().nullable().optional(),
  quietTo: z.string().nullable().optional(),
});

api.get('/preferences/notifications', preferences.get);
api.patch('/preferences/notifications', csrfProtection, validate(prefSchema), preferences.update);

// ── Exports ───────────────────────────────────────────────
api.get('/exports/reports', exports.exportReports);
api.get('/exports/users', requirePermission('users:read'), exports.exportUsers);
api.get('/exports/attendance', exports.exportAttendance);

// ── Meetings ──────────────────────────────────────────────
const meetingCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  attendeeIds: z.array(z.string().cuid()).default([]),
  location: z.string().max(200).optional(),
  type: z.enum(['STANDUP', 'ONE_ON_ONE', 'REVIEW', 'TRAINING', 'OTHER']).default('ONE_ON_ONE'),
});

api.get('/meetings', asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const where = {
    OR: [
      { organizerId: req.user.id },
      { attendees: { some: { userId: req.user.id } } },
    ],
  };
  if (from || to) {
    where.startsAt = {};
    if (from) where.startsAt.gte = new Date(from);
    if (to) where.startsAt.lte = new Date(to);
  }
  const items = await prisma.meeting.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    take: 200,
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });
  res.json({ items });
}));

api.post('/meetings', csrfProtection, validate(meetingCreateSchema), asyncHandler(async (req, res) => {
  const { attendeeIds = [], ...data } = req.body;
  const meeting = await prisma.meeting.create({
    data: {
      ...data,
      organizerId: req.user.id,
      attendees: { create: attendeeIds.map((uid) => ({ userId: uid })) },
    },
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  await Promise.all(attendeeIds.map((uid) =>
    notify(uid, { type: 'meeting', title: `Meeting: ${data.title}`, body: data.description?.slice(0, 200) || '', link: `/meetings/${meeting.id}` })
  ));
  await audit({ userId: req.user.id, action: 'meeting.create', resource: 'meeting', resourceId: meeting.id, req });
  res.status(201).json({ meeting });
}));

api.delete('/meetings/:id', csrfProtection, validate(idParam, 'params'), asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const m = await prisma.meeting.findUnique({ where: { id } });
  if (!m) throw ApiError.notFound();
  if (m.organizerId !== req.user.id && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    throw ApiError.forbidden();
  }
  await prisma.meeting.delete({ where: { id } });
  res.json({ ok: true });
}));

export { publicApi, api };
export default api;
