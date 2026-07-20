// ════════════════════════════════════════════════════════════
//  Community Controller — Discussions, Projects, Badges
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { lru } from '../utils/lru.js';

const invalidateCommunity = () => {
  lru.del('community:discussions');
  lru.del('community:projects');
  lru.del('community:trending');
  lru.del('community:topics');
  lru.del('community:tags');
};

// ═══════════════════════════════════════════════════════════════════════════════
// DISCUSSIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const listDiscussions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = 'latest', topic, tag, search, type, unanswered } = req.validatedQuery;
  const skip = (page - 1) * limit;

  const where = {};
  if (topic) where.topicId = topic;
  if (tag) where.tagIds = { hasSome: [tag] };
  if (type) where.type = type;
  if (unanswered) {
    where.type = 'QUESTION';
    where.isAnswered = false;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { body: { contains: search, mode: 'insensitive' } },
    ];
  }

  let orderBy;
  if (sort === 'trending') orderBy = [{ isHot: 'desc' }, { upvoteCount: 'desc' }];
  else if (sort === 'mostReplies') orderBy = { replyCount: 'desc' };
  else orderBy = { createdAt: 'desc' };

  const cacheKey = `discussions:p${page}:l${limit}:s${sort}:t${topic || ''}:tg${tag || ''}:q${search || ''}`;
  const [discussions, total] = await Promise.all([
    prisma.discussionPost.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        views: true,
        upvoteCount: true,
        replyCount: true,
        isHot: true,
        isPinned: true,
        createdAt: true,
        author: { select: { id: true, name: true, avatarUrl: true } },
        topic: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, color: true } },
        ...(req.user && { upvotes: { where: { userId: req.user.id } } }),
      },
    }),
    prisma.discussionPost.count({ where }),
  ]);

  res.json({
    success: true,
    data: discussions.map(d => ({ ...d, hasUpvoted: !!d.upvotes?.length, upvotes: undefined })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const createDiscussion = asyncHandler(async (req, res) => {
  const { title, body, type, topicId, tagIds } = req.validatedBody;

  const discussion = await prisma.discussionPost.create({
    data: {
      title,
      body,
      type,
      topicId,
      tagIds,
      authorId: req.user.id,
      isHot: false,
      isPinned: false,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      topic: { select: { id: true, name: true } },
      tags: { select: { id: true, name: true, color: true } },
    },
  });

  // Update user community stats
  await prisma.userCommunityStats.upsert({
    where: { userId: req.user.id },
    create: { userId: req.user.id, discussionCount: 1 },
    update: { discussionCount: { increment: 1 } },
  });

  // Audit log
  await audit({ userId: req.user.id, action: 'discussion.create', resource: 'discussion', resourceId: discussion.id, req });

  // Invalidate cache
  invalidateCommunity();

  res.status(201).json({ success: true, data: discussion });
});

export const getDiscussionById = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;

  const discussion = await prisma.discussionPost.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, communityStats: true } },
      topic: { select: { id: true, name: true, slug: true } },
      tags: { select: { id: true, name: true, color: true } },
      upvotes: { where: { userId: req.user.id } },
      replies: {
        take: 5,
        orderBy: { upvoteCount: 'desc' },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          upvotes: { where: { userId: req.user.id } },
        },
      },
    },
  });

  if (!discussion) throw new ApiError(404, 'Discussion not found');

  // Increment view count (only once per user)
  await prisma.discussionPost.update({
    where: { id },
    data: { views: { increment: 1 } },
  });

  res.json({
    success: true,
    data: {
      ...discussion,
      hasUpvoted: discussion.upvotes.length > 0,
      upvotes: undefined,
    },
  });
});

export const updateDiscussion = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;
  const { title, body, tagIds } = req.validatedBody;

  const discussion = await prisma.discussionPost.findUnique({ where: { id } });
  if (!discussion) throw new ApiError(404, 'Discussion not found');

  // Check ownership
  if (discussion.authorId !== req.user.id) throw new ApiError(403, 'Unauthorized');

  const updated = await prisma.discussionPost.update({
    where: { id },
    data: { title, body, ...(tagIds && { tagIds }) },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      tags: { select: { id: true, name: true, color: true } },
    },
  });

  await audit({ userId: req.user.id, action: 'discussion.update', resource: 'discussion', resourceId: id, req });
  invalidateCommunity();

  res.json({ success: true, data: updated });
});

export const deleteDiscussion = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;

  const discussion = await prisma.discussionPost.findUnique({ where: { id } });
  if (!discussion) throw new ApiError(404, 'Discussion not found');

  // Check ownership
  if (discussion.authorId !== req.user.id) throw new ApiError(403, 'Unauthorized');

  await prisma.discussionPost.delete({ where: { id } });

  // Update user community stats
  await prisma.userCommunityStats.update({
    where: { userId: req.user.id },
    data: { discussionCount: { decrement: 1 } },
  });

  await audit({ userId: req.user.id, action: 'discussion.delete', resource: 'discussion', resourceId: id, req });
  invalidateCommunity();

  res.json({ success: true, message: 'Discussion deleted' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DISCUSSION REPLIES
// ═══════════════════════════════════════════════════════════════════════════════

export const createReply = asyncHandler(async (req, res) => {
  const { postId } = req.validatedParams;
  const { body, isAnswer, mentions = [] } = req.validatedBody;

  const post = await prisma.discussionPost.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError(404, 'Discussion not found');

  const reply = await prisma.discussionReply.create({
    data: {
      postId,
      authorId: req.user.id,
      body,
      isAnswer,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      mentions: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  // Update discussion reply count
  await prisma.discussionPost.update({
    where: { id: postId },
    data: { replyCount: { increment: 1 } },
  });

  // Update user community stats
  await prisma.userCommunityStats.upsert({
    where: { userId: req.user.id },
    create: { userId: req.user.id, replyCount: 1 },
    update: { replyCount: { increment: 1 } },
  });

  // Create mentions
  if (mentions.length > 0) {
    await Promise.all(
      mentions.map(userId =>
        prisma.userMention.upsert({
          where: { userId_replyId: { userId, replyId: reply.id } },
          create: { userId, replyId: reply.id },
          update: {},
        })
      )
    );

    // Notify mentioned users
    for (const userId of mentions) {
      await notify(userId, { type: 'mention', title: `${req.user.name} mentioned you`, link: `/discussion/${postId}` });
    }
  }

  // Notify post author
  if (post.authorId !== req.user.id) {
    await notify(post.authorId, { type: 'reply', title: `${req.user.name} replied to your discussion`, link: `/discussion/${postId}` });
  }

  await audit({ userId: req.user.id, action: 'reply.create', resource: 'reply', resourceId: reply.id, meta: { postId }, req });
  invalidateCommunity();

  res.status(201).json({ success: true, data: reply });
});

export const listReplies = asyncHandler(async (req, res) => {
  const { postId } = req.validatedParams;
  const { page = 1, limit = 20, sort = 'latest' } = req.validatedQuery;
  const skip = (page - 1) * limit;

  const post = await prisma.discussionPost.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError(404, 'Discussion not found');

  const orderBy = sort === 'trending' ? { upvoteCount: 'desc' } : { createdAt: 'desc' };

  const [replies, total] = await Promise.all([
    prisma.discussionReply.findMany({
      where: { postId },
      orderBy,
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        upvotes: { where: { userId: req.user.id } },
      },
    }),
    prisma.discussionReply.count({ where: { postId } }),
  ]);

  res.json({
    success: true,
    data: replies.map(r => ({ ...r, hasUpvoted: r.upvotes.length > 0, upvotes: undefined })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const updateReply = asyncHandler(async (req, res) => {
  const { replyId } = req.validatedParams;
  const { body, isAnswer } = req.validatedBody;

  const reply = await prisma.discussionReply.findUnique({ where: { id: replyId } });
  if (!reply) throw new ApiError(404, 'Reply not found');

  if (reply.authorId !== req.user.id) throw new ApiError(403, 'Unauthorized');

  const updated = await prisma.discussionReply.update({
    where: { id: replyId },
    data: { body, ...(isAnswer !== undefined && { isAnswer }) },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  await audit({ userId: req.user.id, action: 'reply.update', resource: 'reply', resourceId: replyId, req });

  res.json({ success: true, data: updated });
});

export const deleteReply = asyncHandler(async (req, res) => {
  const { replyId } = req.validatedParams;

  const reply = await prisma.discussionReply.findUnique({ where: { id: replyId } });
  if (!reply) throw new ApiError(404, 'Reply not found');

  if (reply.authorId !== req.user.id) throw new ApiError(403, 'Unauthorized');

  await prisma.discussionReply.delete({ where: { id: replyId } });

  // Update discussion reply count
  await prisma.discussionPost.update({
    where: { id: reply.postId },
    data: { replyCount: { decrement: 1 } },
  });

  // Update user community stats
  await prisma.userCommunityStats.update({
    where: { userId: req.user.id },
    data: { replyCount: { decrement: 1 } },
  });

  await audit({ userId: req.user.id, action: 'reply.delete', resource: 'reply', resourceId: replyId, req });

  res.json({ success: true, message: 'Reply deleted' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPVOTES
// ═══════════════════════════════════════════════════════════════════════════════

export const upvoteDiscussion = asyncHandler(async (req, res) => {
  const { postId } = req.validatedParams;

  const post = await prisma.discussionPost.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError(404, 'Discussion not found');

  const existing = await prisma.discussionUpvote.findFirst({
    where: { userId: req.user.id, postId },
  });

  if (existing) throw new ApiError(400, 'Already upvoted');

  await prisma.discussionUpvote.create({
    data: { userId: req.user.id, postId },
  });

  await prisma.discussionPost.update({
    where: { id: postId },
    data: { upvoteCount: { increment: 1 } },
  });

  await audit({ userId: req.user.id, action: 'discussion.upvote', resource: 'discussion', resourceId: postId, req });

  res.json({ success: true, message: 'Upvoted' });
});

export const upvoteReply = asyncHandler(async (req, res) => {
  const { replyId } = req.validatedParams;

  const reply = await prisma.discussionReply.findUnique({ where: { id: replyId } });
  if (!reply) throw new ApiError(404, 'Reply not found');

  const existing = await prisma.discussionUpvote.findFirst({
    where: { userId: req.user.id, replyId },
  });

  if (existing) throw new ApiError(400, 'Already upvoted');

  await prisma.discussionUpvote.create({
    data: { userId: req.user.id, replyId },
  });

  await prisma.discussionReply.update({
    where: { id: replyId },
    data: { upvoteCount: { increment: 1 } },
  });

  await audit({ userId: req.user.id, action: 'reply.upvote', resource: 'reply', resourceId: replyId, req });

  res.json({ success: true, message: 'Upvoted' });
});

export const removeDiscussionUpvote = asyncHandler(async (req, res) => {
  const { postId } = req.validatedParams;

  const upvote = await prisma.discussionUpvote.findFirst({
    where: { userId: req.user.id, postId },
  });

  if (!upvote) throw new ApiError(404, 'Upvote not found');

  await prisma.discussionUpvote.delete({ where: { id: upvote.id } });

  await prisma.discussionPost.update({
    where: { id: postId },
    data: { upvoteCount: { decrement: 1 } },
  });

  res.json({ success: true, message: 'Upvote removed' });
});

export const removeReplyUpvote = asyncHandler(async (req, res) => {
  const { replyId } = req.validatedParams;

  const upvote = await prisma.discussionUpvote.findFirst({
    where: { userId: req.user.id, replyId },
  });

  if (!upvote) throw new ApiError(404, 'Upvote not found');

  await prisma.discussionUpvote.delete({ where: { id: upvote.id } });

  await prisma.discussionReply.update({
    where: { id: replyId },
    data: { upvoteCount: { decrement: 1 } },
  });

  res.json({ success: true, message: 'Upvote removed' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TOPICS & TAGS
// ═══════════════════════════════════════════════════════════════════════════════

export const listTopics = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.validatedQuery;
  const skip = (page - 1) * limit;

  const [topics, total] = await Promise.all([
    prisma.communityTopic.findMany({
      orderBy: { order: 'asc' },
      skip,
      take: limit,
      select: { id: true, name: true, slug: true, description: true, icon: true, memberCount: true },
    }),
    prisma.communityTopic.count(),
  ]);

  res.json({
    success: true,
    data: topics,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getTopicById = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;

  const topic = await prisma.communityTopic.findUnique({
    where: { id },
    include: {
      discussions: { take: 10, orderBy: { createdAt: 'desc' } },
      tags: { take: 10 },
    },
  });

  if (!topic) throw new ApiError(404, 'Topic not found');

  res.json({ success: true, data: topic });
});

export const listTags = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.validatedQuery;
  const skip = (page - 1) * limit;

  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};

  const [tags, total] = await Promise.all([
    prisma.communityTag.findMany({
      where,
      orderBy: { memberCount: 'desc' },
      skip,
      take: limit,
      select: { id: true, name: true, slug: true, description: true, color: true, memberCount: true },
    }),
    prisma.communityTag.count({ where }),
  ]);

  res.json({
    success: true,
    data: tags,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNITY PROJECTS
// ═══════════════════════════════════════════════════════════════════════════════

export const listProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = 'latest', tag, search } = req.validatedQuery;
  const skip = (page - 1) * limit;

  const where = {};
  if (tag) where.tagIds = { hasSome: [tag] };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  const orderBy = sort === 'popular' ? { likeCount: 'desc' } : { createdAt: 'desc' };

  const [projects, total] = await Promise.all([
    prisma.communityProject.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: { select: { id: true, name: true, color: true } },
        ...(req.user && { likes: { where: { userId: req.user.id } } }),
      },
    }),
    prisma.communityProject.count({ where }),
  ]);

  res.json({
    success: true,
    data: projects.map(p => ({ ...p, hasLiked: !!p.likes?.length, likes: undefined })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const createProject = asyncHandler(async (req, res) => {
  const { title, description, type, tagIds, gradient, icon, demoUrl, repoUrl } = req.validatedBody;

  const project = await prisma.communityProject.create({
    data: {
      title,
      description,
      type,
      tagIds,
      gradient,
      icon,
      demoUrl,
      repoUrl,
      authorId: req.user.id,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      tags: { select: { id: true, name: true, color: true } },
    },
  });

  await audit({ userId: req.user.id, action: 'project.create', resource: 'project', resourceId: project.id, req });
  invalidateCommunity();

  res.status(201).json({ success: true, data: project });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;

  const project = await prisma.communityProject.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      tags: { select: { id: true, name: true, color: true } },
      likes: { where: { userId: req.user.id } },
    },
  });

  if (!project) throw new ApiError(404, 'Project not found');

  // Increment view count
  await prisma.communityProject.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  res.json({
    success: true,
    data: {
      ...project,
      hasLiked: project.likes.length > 0,
      likes: undefined,
    },
  });
});

export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;
  const data = req.validatedBody;

  const project = await prisma.communityProject.findUnique({ where: { id } });
  if (!project) throw new ApiError(404, 'Project not found');

  if (project.authorId !== req.user.id) throw new ApiError(403, 'Unauthorized');

  const updated = await prisma.communityProject.update({
    where: { id },
    data,
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  await audit({ userId: req.user.id, action: 'project.update', resource: 'project', resourceId: id, req });
  invalidateCommunity();

  res.json({ success: true, data: updated });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;

  const project = await prisma.communityProject.findUnique({ where: { id } });
  if (!project) throw new ApiError(404, 'Project not found');

  if (project.authorId !== req.user.id) throw new ApiError(403, 'Unauthorized');

  await prisma.communityProject.delete({ where: { id } });

  await audit({ userId: req.user.id, action: 'project.delete', resource: 'project', resourceId: id, req });
  invalidateCommunity();

  res.json({ success: true, message: 'Project deleted' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT LIKES
// ═══════════════════════════════════════════════════════════════════════════════

export const likeProject = asyncHandler(async (req, res) => {
  const { projectId } = req.validatedParams;

  const project = await prisma.communityProject.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, 'Project not found');

  const existing = await prisma.communityProjectLike.findFirst({
    where: { userId: req.user.id, projectId },
  });

  if (existing) throw new ApiError(400, 'Already liked');

  await prisma.communityProjectLike.create({
    data: { userId: req.user.id, projectId },
  });

  await prisma.communityProject.update({
    where: { id: projectId },
    data: { likeCount: { increment: 1 } },
  });

  res.json({ success: true, message: 'Project liked' });
});

export const unlikeProject = asyncHandler(async (req, res) => {
  const { projectId } = req.validatedParams;

  const like = await prisma.communityProjectLike.findFirst({
    where: { userId: req.user.id, projectId },
  });

  if (!like) throw new ApiError(404, 'Like not found');

  await prisma.communityProjectLike.delete({ where: { id: like.id } });

  await prisma.communityProject.update({
    where: { id: projectId },
    data: { likeCount: { decrement: 1 } },
  });

  res.json({ success: true, message: 'Like removed' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BADGES & STATS
// ═══════════════════════════════════════════════════════════════════════════════

export const listBadges = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.validatedQuery;
  const skip = (page - 1) * limit;

  const [badges, total] = await Promise.all([
    prisma.communityBadge.findMany({
      skip,
      take: limit,
      select: { id: true, name: true, description: true, icon: true, color: true },
    }),
    prisma.communityBadge.count(),
  ]);

  res.json({
    success: true,
    data: badges,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getUserBadges = asyncHandler(async (req, res) => {
  const badges = await prisma.userBadge.findMany({
    where: { userId: req.user.id },
    include: {
      badge: { select: { id: true, name: true, description: true, icon: true, color: true } },
    },
  });

  res.json({ success: true, data: badges.map(b => ({ ...b.badge, earnedAt: b.earnedAt })) });
});

export const getUserCommunityStats = asyncHandler(async (req, res) => {
  const stats = await prisma.userCommunityStats.findUnique({
    where: { userId: req.user.id },
  });

  const defaultStats = {
    discussionCount: 0,
    replyCount: 0,
    upvoteCount: 0,
    pointsEarned: 0,
    badgeCount: 0,
    helpfulCount: 0,
  };

  res.json({ success: true, data: stats || defaultStats });
});

export const getUserCommunityStatsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.validatedParams;

  const stats = await prisma.userCommunityStats.findUnique({
    where: { userId },
  });

  if (!stats) throw new ApiError(404, 'Stats not found');

  res.json({ success: true, data: stats });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, period = 'month' } = req.validatedQuery;
  const skip = (page - 1) * limit;

  // Calculate date based on period
  const now = new Date();
  let startDate = new Date();
  if (period === 'week') startDate.setDate(now.getDate() - 7);
  if (period === 'month') startDate.setMonth(now.getMonth() - 1);

  const users = await prisma.user.findMany({
    where: {
      communityStats: {
        ...(period !== 'all' && { lastActivityAt: { gte: startDate } }),
      },
    },
    orderBy: { communityStats: { pointsEarned: 'desc' } },
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      communityStats: true,
    },
  });

  const total = await prisma.user.count({
    where: {
      communityStats: {
        ...(period !== 'all' && { lastActivityAt: { gte: startDate } }),
      },
    },
  });

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getTrendingDiscussions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.validatedQuery;
  const skip = (page - 1) * limit;

  // Trending: discussions from last 7 days with most upvotes
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [discussions, total] = await Promise.all([
    prisma.discussionPost.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: [{ isHot: 'desc' }, { upvoteCount: 'desc' }],
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        topic: { select: { id: true, name: true } },
        tags: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.discussionPost.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  res.json({
    success: true,
    data: discussions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export default {
  // Discussions
  listDiscussions,
  createDiscussion,
  getDiscussionById,
  updateDiscussion,
  deleteDiscussion,
  // Replies
  createReply,
  listReplies,
  updateReply,
  deleteReply,
  // Upvotes
  upvoteDiscussion,
  upvoteReply,
  removeDiscussionUpvote,
  removeReplyUpvote,
  // Topics & Tags
  listTopics,
  getTopicById,
  listTags,
  // Projects
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  // Project Likes
  likeProject,
  unlikeProject,
  // Badges & Stats
  listBadges,
  getUserBadges,
  getUserCommunityStats,
  getUserCommunityStatsByUserId,
  getLeaderboard,
  getTrendingDiscussions,
};
