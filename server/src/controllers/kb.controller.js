// ════════════════════════════════════════════════════════════
//  Knowledge Base Controller
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';

const _articleCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  categoryId: z.string().cuid(),
  tags: z.array(z.string().max(40)).max(10).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

const _articleUpdateSchema = _articleCreateSchema.partial();

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function ensureUniqueSlug(base, excludeId) {
  let slug = base || 'article';
  let i = 1;
  while (true) {
    const exists = await prisma.knowledgeArticle.findUnique({ where: { slug } });
    if (!exists || exists.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

// ── Categories ───────────────────────────────────────────
export const listCategories = asyncHandler(async (_req, res) => {
  const cats = await prisma.knowledgeCategory.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { articles: true } } },
  });
  res.json({ items: cats });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, order } = req.body;
  const slug = slugify(name);
  const cat = await prisma.knowledgeCategory.create({
    data: { name, slug, description, icon, order: order ?? 0 },
  });
  await audit({ userId: req.user.id, action: 'kb.category.create', resource: 'category', resourceId: cat.id, req });
  res.status(201).json({ category: cat });
});

// ── Articles ─────────────────────────────────────────────
export const listArticles = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'publishedAt', order, search } = req.validatedQuery;
  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
  }
  if (req.query.categoryId) where.categoryId = req.query.categoryId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.verified) where.verified = req.query.verified === 'true';

  const [items, total] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { versions: true, feedbacks: true } },
      },
    }),
    prisma.knowledgeArticle.count({ where }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const getArticle = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const article = await prisma.knowledgeArticle.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true, avatarUrl: true } },
      versions: {
        orderBy: { version: 'desc' },
        take: 10,
        include: { editor: { select: { id: true, name: true } } },
      },
    },
  });
  if (!article) throw ApiError.notFound();
  // Increment views (fire & forget)
  prisma.knowledgeArticle.update({ where: { id: article.id }, data: { views: { increment: 1 } } }).catch(() => {});
  res.json({ article });
});

export const createArticle = asyncHandler(async (req, res) => {
  const data = req.body;
  const slug = await ensureUniqueSlug(slugify(data.title));
  const article = await prisma.knowledgeArticle.create({
    data: {
      ...data,
      slug,
      authorId: req.user.id,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
  });
  await audit({ userId: req.user.id, action: 'kb.article.create', resource: 'article', resourceId: article.id, req });
  res.status(201).json({ article });
});

export const updateArticle = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound();

  // Permissions: author can edit own drafts; admin/mentor can edit any
  if (
    existing.authorId !== req.user.id &&
    !['SUPER_ADMIN', 'ADMIN', 'MENTOR'].includes(req.user.role)
  ) {
    throw ApiError.forbidden('Not allowed to edit this article');
  }

  const data = req.body;
  const version = await prisma.knowledgeArticleVersion.create({
    data: {
      articleId: existing.id,
      version: (await prisma.knowledgeArticleVersion.count({ where: { articleId: existing.id } })) + 1,
      title: existing.title,
      content: existing.content,
      editorId: req.user.id,
    },
  });

  const update = {
    ...data,
    publishedAt: data.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : existing.publishedAt,
  };
  if (data.title && data.title !== existing.title) {
    update.slug = await ensureUniqueSlug(slugify(data.title), existing.id);
  }

  const article = await prisma.knowledgeArticle.update({ where: { id }, data: update });
  await audit({ userId: req.user.id, action: 'kb.article.update', resource: 'article', resourceId: id, meta: { version: version.version }, req });
  res.json({ article });
});

export const verifyArticle = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const { verified } = req.body;
  const article = await prisma.knowledgeArticle.update({
    where: { id },
    data: {
      verified: !!verified,
      verifiedById: req.user.id,
      verifiedAt: verified ? new Date() : null,
    },
  });
  await audit({ userId: req.user.id, action: 'kb.article.verify', resource: 'article', resourceId: id, meta: { verified: !!verified }, req });
  res.json({ article });
});

export const deleteArticle = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  await prisma.knowledgeArticle.delete({ where: { id } });
  await audit({ userId: req.user.id, action: 'kb.article.delete', resource: 'article', resourceId: id, req });
  res.json({ ok: true });
});

export const submitFeedback = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const { helpful, comment } = req.body;
  await prisma.articleFeedback.create({
    data: { articleId: id, userId: req.user?.id, helpful: !!helpful, comment },
  });
  if (helpful) {
    await prisma.knowledgeArticle.update({
      where: { id },
      data: { helpful: { increment: 1 } },
    });
  }
  res.json({ ok: true });
});

export default {
  listCategories,
  createCategory,
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  verifyArticle,
  deleteArticle,
  submitFeedback,
};
