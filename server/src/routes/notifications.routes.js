// ════════════════════════════════════════════════════════════
//  Notifications Routes — list, mark as read
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();
router.use(authenticate, requireAuth);

// GET /api/v1/notifications  — list current user's notifications, newest first
router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const items = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.user.id, readAt: null },
  });
  res.json({ items, unreadCount });
}));

// PATCH /api/v1/notifications/:id/read — mark a single notification as read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notif || notif.userId !== req.user.id) throw ApiError.notFound('Notification not found');

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { readAt: new Date() },
  });
  res.json({ notification: updated });
}));

// PATCH /api/v1/notifications/read-all — mark all as read
router.patch('/read-all', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ ok: true });
}));

export default router;