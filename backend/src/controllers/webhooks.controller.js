// ════════════════════════════════════════════════════════════
//  Webhook Controller — CRUD + deliveries
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import crypto from 'node:crypto';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { fireWebhook } from '../services/webhook.service.js';

const VALID_EVENTS = [
  'report.submitted', 'report.reviewed',
  'announcement.created', 'announcement.updated',
  'user.created', 'user.role.changed',
  'kb.article.published', 'task.assigned', 'task.completed',
  'attendance.marked', 'qa.question.created', 'qa.answer.created',
];

const _createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(VALID_EVENTS)).min(1),
  enabled: z.boolean().default(true),
});

export const list = asyncHandler(async (req, res) => {
  const items = await prisma.webhook.findMany({
    where: { ownerId: req.user.role === 'SUPER_ADMIN' ? undefined : req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { deliveries: true } } },
  });
  res.json({ items });
});

export const create = asyncHandler(async (req, res) => {
  const data = req.body;
  const secret = crypto.randomBytes(32).toString('hex');
  const hook = await prisma.webhook.create({
    data: { ...data, ownerId: req.user.id, secret },
  });
  await audit({ userId: req.user.id, action: 'webhook.create', resource: 'webhook', resourceId: hook.id, req });
  res.status(201).json({ webhook: { ...hook, secret } }); // only show secret on create
});

export const update = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const hook = await prisma.webhook.findUnique({ where: { id } });
  if (!hook) throw ApiError.notFound();
  if (hook.ownerId !== req.user.id && req.user.role !== 'SUPER_ADMIN') throw ApiError.forbidden();
  const updated = await prisma.webhook.update({ where: { id }, data: req.body });
  await audit({ userId: req.user.id, action: 'webhook.update', resource: 'webhook', resourceId: id, req });
  res.json({ webhook: updated });
});

export const remove = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const hook = await prisma.webhook.findUnique({ where: { id } });
  if (!hook) throw ApiError.notFound();
  if (hook.ownerId !== req.user.id && req.user.role !== 'SUPER_ADMIN') throw ApiError.forbidden();
  await prisma.webhook.delete({ where: { id } });
  await audit({ userId: req.user.id, action: 'webhook.delete', resource: 'webhook', resourceId: id, req });
  res.json({ ok: true });
});

export const deliveries = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const items = await prisma.webhookDelivery.findMany({
    where: { webhookId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ items });
});

// Test endpoint
export const test = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const hook = await prisma.webhook.findUnique({ where: { id } });
  if (!hook) throw ApiError.notFound();
  if (hook.ownerId !== req.user.id && req.user.role !== 'SUPER_ADMIN') throw ApiError.forbidden();
  await fireWebhook('webhook.test', { hook: id, message: 'Hello from SkillNova!' });
  res.json({ ok: true });
});

export const events = asyncHandler(async (_req, res) => {
  res.json({ events: VALID_EVENTS });
});

export default { list, create, update, remove, deliveries, test, events };
