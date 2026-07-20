// ════════════════════════════════════════════════════════════
//  Community Routes - Discussions, Projects, Badges
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { z } from 'zod';
import * as community from '../controllers/community.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, requireAuth);

const idParam = z.object({ id: z.string().cuid() });
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['latest', 'trending', 'mostReplies']).default('latest'),
});

// ── DISCUSSIONS ──────────────────────────────────────────────
router.get(
  '/discussions',
  validate(paginationSchema, 'query'),
  validate(z.object({ topic: z.string().optional(), tag: z.string().optional(), search: z.string().optional(), type: z.enum(['DISCUSSION', 'QUESTION', 'FEEDBACK', 'SHOWCASE']).optional(), unanswered: z.coerce.boolean().optional() }), 'query'),
  community.listDiscussions
);

router.post(
  '/discussions',
  validate(
    z.object({
      title: z.string().min(5).max(200),
      body: z.string().min(10).max(5000),
      type: z.enum(['DISCUSSION', 'QUESTION', 'FEEDBACK', 'SHOWCASE']).default('DISCUSSION'),
      topicId: z.string().cuid(),
      tagIds: z.array(z.string().cuid()).default([]),
    })
  ),
  community.createDiscussion
);

router.get(
  '/discussions/:id',
  validate(idParam, 'params'),
  community.getDiscussionById
);

router.patch(
  '/discussions/:id',
  validate(idParam, 'params'),
  validate(
    z.object({
      title: z.string().min(5).max(200).optional(),
      body: z.string().min(10).max(5000).optional(),
      type: z.enum(['DISCUSSION', 'QUESTION', 'FEEDBACK', 'SHOWCASE']).optional(),
      tagIds: z.array(z.string().cuid()).optional(),
    })
  ),
  community.updateDiscussion
);

router.delete(
  '/discussions/:id',
  validate(idParam, 'params'),
  community.deleteDiscussion
);

// ── DISCUSSION REPLIES ────────────────────────────────────────
router.post(
  '/discussions/:postId/replies',
  validate(z.object({ postId: z.string().cuid() }), 'params'),
  validate(
    z.object({
      body: z.string().min(5).max(3000),
      isAnswer: z.boolean().default(false),
      mentions: z.array(z.string().cuid()).default([]),
    })
  ),
  community.createReply
);

router.get(
  '/discussions/:postId/replies',
  validate(z.object({ postId: z.string().cuid() }), 'params'),
  validate(paginationSchema, 'query'),
  community.listReplies
);

router.patch(
  '/discussions/replies/:replyId',
  validate(z.object({ replyId: z.string().cuid() }), 'params'),
  validate(z.object({ body: z.string().min(5).max(3000).optional(), isAnswer: z.boolean().optional() })),
  community.updateReply
);

router.delete(
  '/discussions/replies/:replyId',
  validate(z.object({ replyId: z.string().cuid() }), 'params'),
  community.deleteReply
);

// ── UPVOTES/LIKES ────────────────────────────────────────────
router.post(
  '/discussions/:postId/upvote',
  validate(z.object({ postId: z.string().cuid() }), 'params'),
  community.upvoteDiscussion
);

router.post(
  '/discussions/replies/:replyId/upvote',
  validate(z.object({ replyId: z.string().cuid() }), 'params'),
  community.upvoteReply
);

router.delete(
  '/discussions/:postId/upvote',
  validate(z.object({ postId: z.string().cuid() }), 'params'),
  community.removeDiscussionUpvote
);

router.delete(
  '/discussions/replies/:replyId/upvote',
  validate(z.object({ replyId: z.string().cuid() }), 'params'),
  community.removeReplyUpvote
);

// ── TOPICS ───────────────────────────────────────────────────
router.get(
  '/topics',
  validate(paginationSchema, 'query'),
  community.listTopics
);

router.get(
  '/topics/:id',
  validate(idParam, 'params'),
  community.getTopicById
);

// ── TAGS ─────────────────────────────────────────────────────
router.get(
  '/tags',
  validate(paginationSchema, 'query'),
  validate(z.object({ search: z.string().optional() }), 'query'),
  community.listTags
);

// ── COMMUNITY PROJECTS ───────────────────────────────────────
router.get(
  '/projects',
  validate(paginationSchema, 'query'),
  validate(z.object({ tag: z.string().optional(), search: z.string().optional(), sort: z.enum(['latest', 'popular']).default('latest') }), 'query'),
  community.listProjects
);

router.post(
  '/projects',
  validate(
    z.object({
      title: z.string().min(3).max(100),
      description: z.string().max(1000).optional(),
      type: z.string().max(50),
      tagIds: z.array(z.string().cuid()).default([]),
      gradient: z.string().optional(),
      icon: z.string().optional(),
      demoUrl: z.string().url().or(z.literal('')).optional(),
      repoUrl: z.string().url().or(z.literal('')).optional(),
    })
  ),
  community.createProject
);

router.get(
  '/projects/:id',
  validate(idParam, 'params'),
  community.getProjectById
);

router.patch(
  '/projects/:id',
  validate(idParam, 'params'),
  validate(
    z.object({
      title: z.string().min(3).max(100).optional(),
      description: z.string().max(1000).optional(),
      type: z.string().max(50).optional(),
      tagIds: z.array(z.string().cuid()).optional(),
      demoUrl: z.string().url().or(z.literal('')).optional().nullable(),
      repoUrl: z.string().url().or(z.literal('')).optional().nullable(),
    })
  ),
  community.updateProject
);

router.delete(
  '/projects/:id',
  validate(idParam, 'params'),
  community.deleteProject
);

// ── PROJECT LIKES ────────────────────────────────────────────
router.post(
  '/projects/:projectId/like',
  validate(z.object({ projectId: z.string().cuid() }), 'params'),
  community.likeProject
);

router.delete(
  '/projects/:projectId/like',
  validate(z.object({ projectId: z.string().cuid() }), 'params'),
  community.unlikeProject
);

// ── BADGES ───────────────────────────────────────────────────
router.get(
  '/badges',
  validate(paginationSchema, 'query'),
  community.listBadges
);

router.get(
  '/user/badges',
  community.getUserBadges
);

// ── USER COMMUNITY STATS ─────────────────────────────────────
router.get(
  '/user/community-stats',
  community.getUserCommunityStats
);

router.get(
  '/user/:userId/community-stats',
  validate(z.object({ userId: z.string().cuid() }), 'params'),
  community.getUserCommunityStatsByUserId
);

// ── COMMUNITY LEADERBOARD ────────────────────────────────────
router.get(
  '/leaderboard',
  validate(paginationSchema, 'query'),
  validate(z.object({ period: z.enum(['week', 'month', 'all']).default('month') }), 'query'),
  community.getLeaderboard
);

// ── TRENDING DISCUSSIONS ─────────────────────────────────────
router.get(
  '/trending',
  validate(paginationSchema, 'query'),
  community.getTrendingDiscussions
);

export default router;
