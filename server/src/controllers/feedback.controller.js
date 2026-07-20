// ════════════════════════════════════════════════════════════
//  Mentor Feedback Controller
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';

const _createSchema = z.object({
  internId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  completionStatus: z.enum(['IN_PROGRESS', 'COMPLETED', 'TERMINATED']),
  comments: z.string().max(2000).optional(),
});

export const list = asyncHandler(async (req, res) => {
  const where = {};
  // Interns only see feedback about themselves
  if (req.user.role === 'INTERN') where.internId = req.user.id;
  // Mentors only see feedback they gave
  else if (req.user.role === 'MENTOR') where.mentorId = req.user.id;
  if (req.query.internId && req.user.role !== 'INTERN') where.internId = req.query.internId;

  const items = await prisma.mentorFeedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      intern: { select: { id: true, name: true, avatarUrl: true } },
      mentor: { select: { id: true, name: true } },
      certificate: { include: { fileAsset: true } },
    },
  });
  res.json({ items });
});

export const create = asyncHandler(async (req, res) => {
  const body = _createSchema.parse(req.body);

  // Only the assigned mentor (or admin+) may submit feedback for this intern
  if (req.user.role === 'MENTOR') {
    const intern = await prisma.internProfile.findFirst({
      where: { userId: body.internId, mentorId: req.user.id },
    });
    if (!intern) throw ApiError.forbidden('Not this intern\'s mentor');
  }

  const feedback = await prisma.mentorFeedback.create({
    data: { ...body, mentorId: req.user.id },
  });

  await audit(req.user.id, 'feedback:create', { targetId: feedback.id });
  await notify(body.internId, {
    type: 'FEEDBACK_RECEIVED',
    title: 'New mentor feedback',
    body: `You received feedback with a rating of ${body.rating}/5.`,
    link: `/feedback/${feedback.id}`,
  });

  res.status(201).json({ feedback });
});

export const getById = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const feedback = await prisma.mentorFeedback.findUnique({
    where: { id },
    include: { intern: true, mentor: true, certificate: true },
  });
  if (!feedback) throw ApiError.notFound();

  const isOwn = feedback.internId === req.user.id;
  const isMentor = feedback.mentorId === req.user.id;
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
  if (!isOwn && !isMentor && !isAdmin) throw ApiError.forbidden();

  res.json({ feedback });
});