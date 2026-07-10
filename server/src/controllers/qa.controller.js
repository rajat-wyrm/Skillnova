// ════════════════════════════════════════════════════════════
//  Q&A Forum Controller
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { emitToRoom } from '../sockets/index.js';

// Question/answer schemas — duplicated in routes for validation
const _questionSchema = z.object({
  title: z.string().trim().min(8).max(200),
  body: z.string().min(10).max(8000),
  category: z.string().max(40).optional(),
});

export const listQuestions = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'createdAt', order, search } = req.validatedQuery;
  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { body: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (req.query.category) where.category = req.query.category;

  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        _count: { select: { answers: true, upvotes: true } },
      },
    }),
    prisma.question.count({ where }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      answers: {
        orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
        include: {
          author: { select: { id: true, name: true, avatarUrl: true, role: true } },
          _count: { select: { upvotes: true } },
        },
      },
    },
  });
  if (!question) throw ApiError.notFound();
  // Increment views
  prisma.question.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
  res.json({ question });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const data = req.body;
  const q = await prisma.question.create({ data: { ...data, authorId: req.user.id } });
  await audit({ userId: req.user.id, action: 'qa.question.create', resource: 'question', resourceId: q.id, req });
  res.status(201).json({ question: q });
});

export const createAnswer = asyncHandler(async (req, res) => {
  const qid = req.validatedParams.id;
  const { body } = req.body;
  const a = await prisma.answer.create({
    data: { questionId: qid, authorId: req.user.id, body },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
    },
  });
  const question = await prisma.question.findUnique({ where: { id: qid } });
  if (question?.authorId && question.authorId !== req.user.id) {
    await notify(question.authorId, {
      type: 'qa',
      title: 'New answer to your question',
      body: a.body.slice(0, 180),
      link: `/qa/${qid}`,
    });
  }
  await audit({ userId: req.user.id, action: 'qa.answer.create', resource: 'answer', resourceId: a.id, req });
  emitToRoom(`qa:${qid}`, 'qa:answer', { questionId: qid, answer: a });
  res.status(201).json({ answer: a });
});

export const upvote = asyncHandler(async (req, res) => {
  const { type, id } = req.body; // type: 'question' | 'answer'
  if (type === 'question') {
    await prisma.upvote.upsert({
      where: { userId_questionId: { userId: req.user.id, questionId: id } },
      update: {},
      create: { userId: req.user.id, questionId: id },
    });
  } else if (type === 'answer') {
    await prisma.upvote.upsert({
      where: { userId_answerId: { userId: req.user.id, answerId: id } },
      update: {},
      create: { userId: req.user.id, answerId: id },
    });
  } else throw ApiError.badRequest('Invalid type');

  res.json({ ok: true });
});

export const acceptAnswer = asyncHandler(async (req, res) => {
  const answerId = req.validatedParams.id;
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: { question: true },
  });
  if (!answer) throw ApiError.notFound();
  if (answer.question.authorId !== req.user.id && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    throw ApiError.forbidden('Only the question author or admin can accept');
  }
  await prisma.$transaction([
    prisma.answer.update({ where: { id: answerId }, data: { isAccepted: true } }),
    prisma.answer.updateMany({
      where: { questionId: answer.questionId, id: { not: answerId } },
      data: { isAccepted: false },
    }),
    prisma.question.update({ where: { id: answer.questionId }, data: { acceptedAnswerId: answerId } }),
  ]);
  res.json({ ok: true });
});

export default { listQuestions, getQuestion, createQuestion, createAnswer, upvote, acceptAnswer };
