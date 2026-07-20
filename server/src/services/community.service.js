// ════════════════════════════════════════════════════════════
//  Community Service — Helper functions and utilities
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';

/**
 * Award badge to user based on criteria
 */
export async function awardBadge(userId, badgeId) {
  return prisma.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    create: { userId, badgeId },
    update: {},
  });
}

/**
 * Update user community stats with points
 */
export async function updateUserStats(userId, stats) {
  return prisma.userCommunityStats.upsert({
    where: { userId },
    create: {
      userId,
      ...stats,
    },
    update: stats,
  });
}

/**
 * Get user reputation level based on points
 */
export function getReputationLevel(points) {
  if (points >= 1000) return 'Expert';
  if (points >= 500) return 'Contributor';
  if (points >= 200) return 'Helper';
  if (points >= 50) return 'Participant';
  return 'Newcomer';
}

/**
 * Calculate hot status for discussions (Hot badge)
 * A discussion is hot if it has >10 replies and >20 upvotes in last 24 hours
 */
export async function markHotDiscussions() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const hotDiscussions = await prisma.discussionPost.findMany({
    where: {
      createdAt: { gte: twentyFourHoursAgo },
      replyCount: { gte: 10 },
      upvoteCount: { gte: 20 },
    },
    select: { id: true },
  });

  for (const discussion of hotDiscussions) {
    await prisma.discussionPost.update({
      where: { id: discussion.id },
      data: { isHot: true },
    });
  }

  return hotDiscussions.length;
}

/**
 * Get trending topics based on activity
 */
export async function getTrendingTopics(limit = 10) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return prisma.communityTopic.findMany({
    take: limit,
    orderBy: {
      discussions: {
        _count: 'desc',
      },
    },
    include: {
      discussions: {
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { id: true },
      },
      _count: {
        select: { discussions: true },
      },
    },
  });
}

/**
 * Search discussions across title, body, and tags
 */
export async function searchDiscussions(query, options = {}) {
  const { limit = 20, offset = 0, topicId, tagIds } = options;

  const where = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { body: { contains: query, mode: 'insensitive' } },
    ],
    ...(topicId && { topicId }),
    ...(tagIds && { tagIds: { hasSome: tagIds } }),
  };

  const [results, total] = await Promise.all([
    prisma.discussionPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        topic: { select: { id: true, name: true } },
        tags: { select: { id: true, name: true } },
      },
    }),
    prisma.discussionPost.count({ where }),
  ]);

  return { results, total, hasMore: offset + limit < total };
}

/**
 * Get user contributions summary
 */
export async function getUserContributionsSummary(userId) {
  const [discussions, replies, projects, badges] = await Promise.all([
    prisma.discussionPost.count({ where: { authorId: userId } }),
    prisma.discussionReply.count({ where: { authorId: userId } }),
    prisma.communityProject.count({ where: { authorId: userId } }),
    prisma.userBadge.count({ where: { userId } }),
  ]);

  return { discussions, replies, projects, badges };
}

/**
 * Get related discussions based on tags and topic
 */
export async function getRelatedDiscussions(discussionId, limit = 5) {
  const discussion = await prisma.discussionPost.findUnique({
    where: { id: discussionId },
    select: { topicId: true, tagIds: true },
  });

  if (!discussion) return [];

  return prisma.discussionPost.findMany({
    where: {
      id: { not: discussionId },
      OR: [
        { topicId: discussion.topicId },
        { tagIds: { hasSome: discussion.tagIds } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      replyCount: true,
      upvoteCount: true,
      author: { select: { name: true } },
    },
  });
}

/**
 * Initialize community badges in database
 */
export async function initializeBadges() {
  const badges = [
    {
      name: 'First Post',
      description: 'Created your first discussion',
      icon: '🚀',
      color: '#ff6d34',
    },
    {
      name: 'Helpful',
      description: 'Had 10 replies marked as helpful',
      icon: '🤝',
      color: '#00bea3',
    },
    {
      name: 'Expert',
      description: 'Earned 1000+ community points',
      icon: '⭐',
      color: '#7c3aed',
    },
    {
      name: 'Mentor',
      description: 'Helped 50+ community members',
      icon: '👨‍🏫',
      color: '#f59e0b',
    },
    {
      name: 'Popular',
      description: 'Project received 100+ likes',
      icon: '❤️',
      color: '#ef4444',
    },
  ];

  for (const badge of badges) {
    await prisma.communityBadge.upsert({
      where: { name: badge.name },
      create: badge,
      update: badge,
    });
  }

  return badges.length;
}

/**
 * Initialize community topics
 */
export async function initializeTopics() {
  const topics = [
    {
      name: 'React',
      slug: 'react',
      description: 'React framework and related libraries',
      icon: '⚛️',
      order: 1,
    },
    {
      name: 'UI/UX Design',
      slug: 'ui-ux-design',
      description: 'User interface and experience design',
      icon: '🎨',
      order: 2,
    },
    {
      name: 'Career & Jobs',
      slug: 'career-jobs',
      description: 'Career advice and job opportunities',
      icon: '💼',
      order: 3,
    },
    {
      name: 'JavaScript',
      slug: 'javascript',
      description: 'JavaScript programming language',
      icon: '📜',
      order: 4,
    },
    {
      name: 'Frontend',
      slug: 'frontend',
      description: 'Frontend development techniques',
      icon: '🖥️',
      order: 5,
    },
  ];

  for (const topic of topics) {
    await prisma.communityTopic.upsert({
      where: { slug: topic.slug },
      create: topic,
      update: topic,
    });
  }

  return topics.length;
}

/**
 * Initialize community tags
 */
export async function initializeTags() {
  const tags = [
    { name: 'beginner', slug: 'beginner', color: '#00bea3' },
    { name: 'advanced', slug: 'advanced', color: '#7c3aed' },
    { name: 'tutorial', slug: 'tutorial', color: '#f59e0b' },
    { name: 'help-wanted', slug: 'help-wanted', color: '#ef4444' },
    { name: 'showcase', slug: 'showcase', color: '#3b82f6' },
  ];

  for (const tag of tags) {
    await prisma.communityTag.upsert({
      where: { slug: tag.slug },
      create: tag,
      update: tag,
    });
  }

  return tags.length;
}

/**
 * Batch update tag member counts
 */
export async function updateTagMemberCounts() {
  const tags = await prisma.communityTag.findMany();

  for (const tag of tags) {
    const count = await prisma.discussionPost.count({
      where: { tagIds: { hasSome: [tag.id] } },
    });

    await prisma.communityTag.update({
      where: { id: tag.id },
      data: { memberCount: count },
    });
  }
}

/**
 * Batch update topic member counts
 */
export async function updateTopicMemberCounts() {
  const topics = await prisma.communityTopic.findMany();

  for (const topic of topics) {
    const count = await prisma.discussionPost.count({
      where: { topicId: topic.id },
    });

    await prisma.communityTopic.update({
      where: { id: topic.id },
      data: { memberCount: count },
    });
  }
}

export default {
  awardBadge,
  updateUserStats,
  getReputationLevel,
  markHotDiscussions,
  getTrendingTopics,
  searchDiscussions,
  getUserContributionsSummary,
  getRelatedDiscussions,
  initializeBadges,
  initializeTopics,
  initializeTags,
  updateTagMemberCounts,
  updateTopicMemberCounts,
};
