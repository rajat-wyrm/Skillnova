// ════════════════════════════════════════════════════════════
//  Announcements Controller
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { broadcast, notifyMany } from '../services/notification.service.js';
import { lru } from '../utils/lru.js';

const _createSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().min(1).max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  pinned: z.boolean().default(false),
  expiresAt: z.coerce.date().optional().nullable(),
});

const _updateSchema = _createSchema.partial();

export const list = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'publishedAt', order } = req.validatedQuery;
  const where = {};
  if (req.query.priority) where.priority = req.query.priority;
  if (req.query.pinned) where.pinned = req.query.pinned === 'true';

  const cacheKey = `announcements:list:p${page}:l${limit}:s${sort}:o${order}:pr${req.query.priority || ''}:pn${req.query.pinned || ''}`;
  const payload = await lru.wrap(cacheKey, 20, async () => {
    const [items, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { [sort]: order }],
        skip: (page - 1) * limit,
        take: limit,
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      }),
      prisma.announcement.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  });
  res.json(payload);
});

export const getById = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const item = await prisma.announcement.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { reads: true } },
    },
  });
  if (!item) throw ApiError.notFound();
  res.json({ announcement: item });
});

export const create = asyncHandler(async (req, res) => {
  const data = req.body;
  const item = await prisma.announcement.create({
    data: { ...data, authorId: req.user.id },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });
  await audit({ userId: req.user.id, action: 'announcement.create', resource: 'announcement', resourceId: item.id, req });

  // Notify all active users
  const users = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
  await notifyMany(
    users.map((u) => u.id),
    { type: 'announcement', title: item.title, body: item.body.slice(0, 200), link: `/announcements/${item.id}` }
  );
  broadcast({ type: 'announcement', title: item.title });

  res.status(201).json({ announcement: item });
});

export const update = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const item = await prisma.announcement.update({ where: { id }, data: req.body });
  await audit({ userId: req.user.id, action: 'announcement.update', resource: 'announcement', resourceId: id, req });
  res.json({ announcement: item });
});

export const togglePin = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound();
  const item = await prisma.announcement.update({
    where: { id },
    data: { pinned: !existing.pinned },
  });
  await audit({ userId: req.user.id, action: 'announcement.pin', resource: 'announcement', resourceId: id, meta: { pinned: item.pinned }, req });
  res.json({ announcement: item });
});

export const remove = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  await prisma.announcement.delete({ where: { id } });
  await audit({ userId: req.user.id, action: 'announcement.delete', resource: 'announcement', resourceId: id, req });
  res.json({ ok: true });
});

export const markRead = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  await prisma.announcementRead.upsert({
    where: { announcementId_userId: { announcementId: id, userId: req.user.id } },
    update: { readAt: new Date() },
    create: { announcementId: id, userId: req.user.id },
  });
  res.json({ ok: true });
});

export default { list, getById, create, update, togglePin, remove, markRead };
