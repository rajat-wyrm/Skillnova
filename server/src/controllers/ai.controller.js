// ════════════════════════════════════════════════════════════
//  AI Assistant Controller — chat, history, suggestions
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { chatCompletion, chatCompletionStream, suggestFollowUps } from '../ai/assistant.service.js';
import { audit } from '../services/audit.service.js';

const _chatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  sessionId: z.string().cuid().optional(),
});

export const chat = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  let session;
  if (sessionId) {
    session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== req.user.id) throw ApiError.notFound('Session not found');
  } else {
    session = await prisma.chatSession.create({
      data: {
        userId: req.user.id,
        title: message.slice(0, 60),
      },
    });
  }

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'asc' },
    take: 20,
    select: { role: true, content: true },
  });

  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'user', content: message },
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let result;
  try {
    result = await Promise.race([
      chatCompletion({ user: req.user, history, userMessage: message }),
      new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error('AI request timed out')))),
    ]);
  } finally {
    clearTimeout(timeout);
  }
  const assistantMsg = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: result.reply,
      tokens: result.tokens,
      meta: { model: result.model, actions: result.actions },
    },
  });

  await prisma.chatSession.update({
    where: { id: session.id },
    data: { updatedAt: new Date() },
  });

  await audit({ userId: req.user.id, action: 'ai.chat', resource: 'chat', resourceId: session.id, req });
  res.json({ sessionId: session.id, message: assistantMsg, reply: result.reply, actions: result.actions });
});

export const streamChat = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  let session;
  if (sessionId) {
    session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== req.user.id) throw ApiError.notFound();
  } else {
    session = await prisma.chatSession.create({
      data: { userId: req.user.id, title: message.slice(0, 60) },
    });
  }

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'asc' },
    take: 20,
    select: { role: true, content: true },
  });

  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'user', content: message },
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let full = '';
  const streamController = new AbortController();
  const streamTimeout = setTimeout(() => streamController.abort(), 30_000);
  try {
    for await (const chunk of chatCompletionStream({ user: req.user, history, userMessage: message })) {
      full += chunk;
      res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
    }
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: full },
    });
    res.write(`data: ${JSON.stringify({ done: true, sessionId: session.id })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    clearTimeout(streamTimeout);
    res.end();
  }
});

export const listSessions = asyncHandler(async (req, res) => {
  const items = await prisma.chatSession.findMany({
    where: { userId: req.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: { _count: { select: { messages: true } } },
  });
  res.json({ items });
});

export const getSession = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const session = await prisma.chatSession.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });
  if (!session || session.userId !== req.user.id) throw ApiError.notFound();
  res.json({ session });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const session = await prisma.chatSession.findUnique({ where: { id } });
  if (!session || session.userId !== req.user.id) throw ApiError.forbidden();
  await prisma.chatSession.delete({ where: { id } });
  res.json({ ok: true });
});

export const suggest = asyncHandler(async (req, res) => {
  const message = req.query.q;
  if (!message) return res.json({ suggestions: [] });
  try {
    const suggestions = await suggestFollowUps(String(message));
    res.json({ suggestions });
  } catch {
    res.json({ suggestions: [] });
  }
});

export default { chat, streamChat, listSessions, getSession, deleteSession, suggest };
