// ════════════════════════════════════════════════════════════
//  Peer-to-Peer Routes
//  Direct Messaging, Study Groups & Skill Matcher
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { z } from 'zod';
import * as peer from '../controllers/peer.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, requireAuth, requirePermission('peer:use'));

const idParam = z.object({ id: z.string().cuid() });
const recipientIdParam = z.object({ recipientId: z.string().cuid() });

// ── Direct Messaging (DMs) ────────────────────────────────────
router.get('/conversations', peer.listConversations);

router.get(
  '/messages/:recipientId',
  validate(recipientIdParam, 'params'),
  peer.getMessages,
);

router.post(
  '/messages',
  validate(
    z.object({
      recipientId: z.string().cuid(),
      content: z.string().min(1).max(5000),
      attachments: z.any().optional(),
    }),
  ),
  peer.sendMessage,
);

router.post(
  '/messages/:recipientId/read',
  validate(recipientIdParam, 'params'),
  peer.markMessagesRead,
);

// ── Study Groups ──────────────────────────────────────────────
router.get('/study-groups', peer.listStudyGroups);

router.post(
  '/study-groups',
  validate(
    z.object({
      name: z.string().min(3).max(100),
      description: z.string().max(1000).optional().nullable(),
      topic: z.string().max(100).optional().nullable(),
      skills: z.union([z.array(z.string()), z.string()]).optional(),
      maxMembers: z.coerce.number().int().min(2).max(50).default(10),
      meetingLink: z.string().url().optional().nullable().or(z.literal('')),
    }),
  ),
  peer.createStudyGroup,
);

router.get(
  '/study-groups/:id',
  validate(idParam, 'params'),
  peer.getStudyGroup,
);

router.post(
  '/study-groups/:id/join',
  validate(idParam, 'params'),
  peer.joinStudyGroup,
);

router.post(
  '/study-groups/:id/leave',
  validate(idParam, 'params'),
  peer.leaveStudyGroup,
);

router.post(
  '/study-groups/:id/messages',
  validate(idParam, 'params'),
  validate(
    z.object({
      content: z.string().min(1).max(5000),
      attachments: z.any().optional(),
    }),
  ),
  peer.sendStudyGroupMessage,
);

router.post(
  '/study-groups/:id/invite',
  validate(idParam, 'params'),
  validate(
    z.object({
      userId: z.string().cuid(),
      note: z.string().max(300).optional(),
    }),
  ),
  peer.inviteToStudyGroup,
);

// ── Skill Matcher & Public Profiles ───────────────────────────
router.get('/match', peer.matchTeammates);

router.get(
  '/users/:id',
  validate(idParam, 'params'),
  peer.getPeerProfile,
);

export default router;
