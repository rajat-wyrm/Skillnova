// ════════════════════════════════════════════════════════════
//  Peer-to-Peer Controller
//  Direct Messaging, Study Groups & Skill-Based Teammate Matcher
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { getIO } from '../sockets/index.js';

// ─────────────────────────────────────────────────────────────
// 1. DIRECT MESSAGING (DMs)
// ─────────────────────────────────────────────────────────────

/**
 * List all conversations for the current user.
 * Groups by partner user, returning latest message and unread count.
 */
export const listConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;

  // Find all messages involving the current user
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: currentUserId },
        { recipientId: currentUserId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          department: true,
          college: true,
          skills: true,
          rating: true,
          status: true,
        },
      },
      recipient: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          department: true,
          college: true,
          skills: true,
          rating: true,
          status: true,
        },
      },
    },
  });

  // Group messages by the other user's ID
  const conversationMap = new Map();

  for (const msg of messages) {
    const isSender = msg.senderId === currentUserId;
    const partner = isSender ? msg.recipient : msg.sender;
    const partnerId = partner.id;

    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partner,
        lastMessage: {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          read: msg.read,
          createdAt: msg.createdAt,
        },
        unreadCount: 0,
      });
    }

    // Accumulate unread count if message was sent to current user and is unread
    if (msg.recipientId === currentUserId && !msg.read) {
      const conv = conversationMap.get(partnerId);
      conv.unreadCount += 1;
    }
  }

  const conversations = Array.from(conversationMap.values());

  res.json({ conversations });
});

/**
 * Get message history between current user and a recipient.
 */
export const getMessages = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { recipientId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  // Check if partner exists
  const partner = await prisma.user.findUnique({
    where: { id: recipientId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      department: true,
      college: true,
      skills: true,
      rating: true,
      status: true,
    },
  });

  if (!partner) throw ApiError.notFound('User not found');

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: currentUserId, recipientId },
        { senderId: recipientId, recipientId: currentUserId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  // Automatically mark incoming unread messages as read
  const unreadIds = messages
    .filter((m) => m.senderId === recipientId && m.recipientId === currentUserId && !m.read)
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await prisma.directMessage.updateMany({
      where: { id: { in: unreadIds } },
      data: { read: true, readAt: new Date() },
    });

    // Notify sender via socket
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${recipientId}`).emit('dm:read', {
          readerId: currentUserId,
          messageIds: unreadIds,
        });
      }
    } catch {
      /* socket error ignored */
    }
  }

  res.json({ partner, messages });
});

/**
 * Send a direct message.
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { recipientId, content, attachments } = req.body;

  if (currentUserId === recipientId) {
    throw ApiError.badRequest('Cannot send a direct message to yourself');
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, name: true, email: true },
  });
  if (!recipient) throw ApiError.notFound('Recipient not found');

  const message = await prisma.directMessage.create({
    data: {
      senderId: currentUserId,
      recipientId,
      content: content.trim(),
      attachments: attachments ? attachments : undefined,
    },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
      recipient: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
    },
  });

  // Real-time socket dispatch
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${recipientId}`).emit('dm:receive', message);
      io.to(`user:${currentUserId}`).emit('dm:receive', message);
    }
  } catch {
    /* socket fallback */
  }

  // Trigger in-app notification to recipient
  await notify(recipientId, {
    type: 'dm',
    title: `New message from ${req.user.name}`,
    body: content.length > 60 ? `${content.slice(0, 57)}...` : content,
    link: '/peers',
  });

  res.status(201).json({ message });
});

/**
 * Mark messages from a specific sender as read.
 */
export const markMessagesRead = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { recipientId } = req.params;

  const result = await prisma.directMessage.updateMany({
    where: {
      senderId: recipientId,
      recipientId: currentUserId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  try {
    const io = getIO();
    if (io) {
      io.to(`user:${recipientId}`).emit('dm:read', { readerId: currentUserId });
    }
  } catch {
    /* socket error ignored */
  }

  res.json({ success: true, count: result.count });
});

// ─────────────────────────────────────────────────────────────
// 2. STUDY GROUPS & PEER COHORTS
// ─────────────────────────────────────────────────────────────

/**
 * List study groups with search and skill filter.
 */
export const listStudyGroups = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { filter = 'all', search, skill } = req.query;

  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { topic: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (filter === 'mine') {
    where.members = { some: { userId: currentUserId } };
  }

  const groups = await prisma.studyGroup.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, role: true, skills: true },
          },
        },
      },
      _count: {
        select: { messages: true, members: true },
      },
    },
  });

  // Filter in-memory for skill if provided
  let filtered = groups;
  if (skill) {
    const target = skill.toLowerCase();
    filtered = groups.filter((g) => {
      if (Array.isArray(g.skills)) {
        return g.skills.some((s) => s.toLowerCase().includes(target));
      }
      if (typeof g.skills === 'string') {
        return g.skills.toLowerCase().includes(target);
      }
      return false;
    });
  }

  const formatted = filtered.map((g) => ({
    ...g,
    memberCount: g.members.length,
    isMember: g.members.some((m) => m.userId === currentUserId),
    isCreator: g.createdById === currentUserId,
  }));

  res.json({ groups: formatted });
});

/**
 * Create a new study group.
 */
export const createStudyGroup = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { name, description, topic, skills = [], maxMembers = 10, meetingLink } = req.body;

  const skillArray = Array.isArray(skills)
    ? skills
    : typeof skills === 'string'
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const group = await prisma.studyGroup.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      topic: topic?.trim() || null,
      skills: skillArray,
      maxMembers: Number(maxMembers) || 10,
      meetingLink: meetingLink?.trim() || null,
      createdById: currentUserId,
      members: {
        create: {
          userId: currentUserId,
          role: 'CREATOR',
        },
      },
    },
    include: {
      createdBy: {
        select: { id: true, name: true, avatarUrl: true },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  });

  await audit({
    userId: currentUserId,
    action: 'study_group.create',
    resource: 'study_group',
    resourceId: group.id,
    meta: { name: group.name, topic: group.topic },
    req,
  });

  res.status(201).json({ group });
});

/**
 * Get details, members, and recent messages of a study group.
 */
export const getStudyGroup = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { id } = req.params;

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
              department: true,
              skills: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      messages: {
        take: 50,
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true, role: true },
          },
        },
      },
    },
  });

  if (!group) throw ApiError.notFound('Study group not found');

  const isMember = group.members.some((m) => m.userId === currentUserId);
  const isCreator = group.createdById === currentUserId;

  res.json({
    group: {
      ...group,
      isMember,
      isCreator,
      memberCount: group.members.length,
    },
  });
});

/**
 * Join a study group.
 */
export const joinStudyGroup = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { id } = req.params;

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!group) throw ApiError.notFound('Study group not found');

  const alreadyMember = group.members.some((m) => m.userId === currentUserId);
  if (alreadyMember) throw ApiError.badRequest('You are already a member of this study group');

  if (group.members.length >= group.maxMembers) {
    throw ApiError.badRequest('This study group has reached its maximum member capacity');
  }

  const member = await prisma.studyGroupMember.create({
    data: {
      groupId: id,
      userId: currentUserId,
      role: 'MEMBER',
    },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true, role: true, skills: true },
      },
    },
  });

  // Socket broadcast to room
  try {
    const io = getIO();
    if (io) {
      io.to(`study_group:${id}`).emit('group:member_joined', {
        groupId: id,
        member,
      });
    }
  } catch {
    /* socket ignored */
  }

  // Notify group creator
  if (group.createdById !== currentUserId) {
    await notify(group.createdById, {
      type: 'group_join',
      title: `${req.user.name} joined your study group`,
      body: `New member joined "${group.name}".`,
      link: '/peers',
    });
  }

  res.json({ success: true, member });
});

/**
 * Leave a study group.
 */
export const leaveStudyGroup = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { id } = req.params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: id,
        userId: currentUserId,
      },
    },
  });

  if (!membership) throw ApiError.badRequest('You are not a member of this study group');

  await prisma.studyGroupMember.delete({
    where: { id: membership.id },
  });

  try {
    const io = getIO();
    if (io) {
      io.to(`study_group:${id}`).emit('group:member_left', {
        groupId: id,
        userId: currentUserId,
      });
    }
  } catch {
    /* socket ignored */
  }

  res.json({ success: true });
});

/**
 * Send a message inside a study group.
 */
export const sendStudyGroupMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { id } = req.params;
  const { content, attachments } = req.body;

  const membership = await prisma.studyGroupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: id,
        userId: currentUserId,
      },
    },
  });

  if (!membership) throw ApiError.forbidden('You must be a member of this group to send messages');

  const message = await prisma.studyGroupMessage.create({
    data: {
      groupId: id,
      senderId: currentUserId,
      content: content.trim(),
      attachments: attachments ? attachments : undefined,
    },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
    },
  });

  // Broadcast to study group socket room
  try {
    const io = getIO();
    if (io) {
      io.to(`study_group:${id}`).emit('group:receive', {
        groupId: id,
        message,
      });
    }
  } catch {
    /* socket ignored */
  }

  res.status(201).json({ message });
});

/**
 * Invite a peer to a study group.
 */
export const inviteToStudyGroup = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { id } = req.params;
  const { userId, note } = req.body;

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    select: { id: true, name: true, topic: true },
  });
  if (!group) throw ApiError.notFound('Study group not found');

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!targetUser) throw ApiError.notFound('User to invite not found');

  // Send an automatic DM invite
  const dmContent = `Hey ${targetUser.name}! I'd love to invite you to join our study group "${group.name}"${group.topic ? ` (${group.topic})` : ''}.${note ? ` Note: ${note}` : ''}`;
  
  const message = await prisma.directMessage.create({
    data: {
      senderId: currentUserId,
      recipientId: userId,
      content: dmContent,
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true, role: true } },
    },
  });

  try {
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('dm:receive', message);
    }
  } catch {
    /* socket ignored */
  }

  await notify(userId, {
    type: 'group_invite',
    title: `Study Group Invite from ${req.user.name}`,
    body: `You've been invited to join "${group.name}". Check your messages!`,
    link: '/peers',
  });

  res.json({ success: true, message });
});

// ─────────────────────────────────────────────────────────────
// 3. "FIND A TEAMMATE FOR X SKILL" MATCHER
// ─────────────────────────────────────────────────────────────

/**
 * Match teammates based on required skill query, department, college, and badges.
 */
export const matchTeammates = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { skills: skillQuery, department, college, search, role = 'INTERN' } = req.query;

  // Search terms
  const targetSkills = skillQuery
    ? skillQuery.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const where = {
    id: { not: currentUserId },
    status: { in: ['ACTIVE', 'PENDING'] },
  };

  if (role && role !== 'ALL') {
    where.role = role;
  }

  if (department) {
    where.department = { contains: department, mode: 'insensitive' };
  }

  if (college) {
    where.college = { contains: college, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
      { skills: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      department: true,
      college: true,
      yearOfStudy: true,
      skills: true,
      rating: true,
      status: true,
      internProfile: {
        select: {
          isTL: true,
          project: { select: { id: true, name: true } },
          totalTasks: true,
          completedTasks: true,
        },
      },
      badgeAwards: {
        include: { badge: { select: { name: true, icon: true, type: true } } },
      },
    },
    take: 100,
  });

  // Calculate Match Score & extract parsed skills
  const candidates = users.map((u) => {
    const userSkills = (u.skills || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Calculate skill overlap
    let matchedSkills = [];
    let matchScore = 50; // base score

    if (targetSkills.length > 0) {
      matchedSkills = userSkills.filter((s) =>
        targetSkills.some((ts) => s.toLowerCase().includes(ts) || ts.includes(s.toLowerCase()))
      );

      const skillMatchRatio = matchedSkills.length / targetSkills.length;
      matchScore = Math.round(skillMatchRatio * 60 + 30); // 30-90%
    } else {
      matchedSkills = userSkills.slice(0, 4);
    }

    // Boost score slightly for ratings and completed tasks
    if (u.rating > 0) {
      matchScore = Math.min(99, matchScore + Math.round(u.rating * 1.5));
    }
    if (u.internProfile?.completedTasks > 0) {
      matchScore = Math.min(99, matchScore + 5);
    }

    return {
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        role: u.role,
        department: u.department,
        college: u.college,
        yearOfStudy: u.yearOfStudy,
        skills: userSkills,
        rating: u.rating,
        status: u.status,
        isTL: u.internProfile?.isTL || false,
        projectName: u.internProfile?.project?.name || null,
        badges: u.badgeAwards.map((b) => b.badge),
      },
      matchScore: Math.min(99, Math.max(20, matchScore)),
      matchedSkills,
      allSkills: userSkills,
    };
  });

  // Sort by highest match score descending
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  res.json({ candidates });
});

/**
 * Get public peer profile for teammate preview.
 */
export const getPeerProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      department: true,
      college: true,
      yearOfStudy: true,
      skills: true,
      rating: true,
      status: true,
      createdAt: true,
      internProfile: {
        select: {
          isTL: true,
          startDate: true,
          project: { select: { id: true, name: true, description: true } },
        },
      },
      badgeAwards: {
        include: { badge: true },
      },
      studyGroupMemberships: {
        include: {
          group: { select: { id: true, name: true, topic: true } },
        },
      },
    },
  });

  if (!user) throw ApiError.notFound('Peer profile not found');

  const skillsList = (user.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  res.json({
    peer: {
      ...user,
      skills: skillsList,
      badges: user.badgeAwards.map((b) => b.badge),
      studyGroups: user.studyGroupMemberships.map((m) => m.group),
    },
  });
});

export default {
  listConversations,
  getMessages,
  sendMessage,
  markMessagesRead,
  listStudyGroups,
  createStudyGroup,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  sendStudyGroupMessage,
  inviteToStudyGroup,
  matchTeammates,
  getPeerProfile,
};
