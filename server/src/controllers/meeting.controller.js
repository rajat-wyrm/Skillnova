// ════════════════════════════════════════════════════════════
//  Meeting Controller — listing, creating, and RSVPing meetings
// ════════════════════════════════════════════════════════════
import prisma from "../utils/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../services/audit.service.js";
import { notify } from "../services/notification.service.js";

// ── GET /meetings — Fetch all meetings for logged-in user ──
export const listMeetings = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const where = {
    OR: [
      { organizerId: req.user.id },
      { attendees: { some: { userId: req.user.id } } },
    ],
  };
  if (from || to) {
    where.startsAt = {};
    if (from) where.startsAt.gte = new Date(from);
    if (to) where.startsAt.lte = new Date(to);
  }
  const items = await prisma.meeting.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    take: 200,
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });
  res.json({ items });
});

// ── POST /meetings — Mentor schedules a meeting ──
export const createMeeting = asyncHandler(async (req, res) => {
  const { title, description, startsAt, endsAt, attendeeIds = [], location, meetingLink, type } = req.body;

  if (!title || !title.trim()) {
    throw ApiError.badRequest("Title is required");
  }

  const starts = new Date(startsAt);
  if (isNaN(starts.getTime())) {
    throw ApiError.badRequest("Invalid start date");
  }

  let ends = null;
  if (endsAt) {
    ends = new Date(endsAt);
    if (isNaN(ends.getTime())) {
      throw ApiError.badRequest("Invalid end date");
    }
    if (ends <= starts) {
      throw ApiError.badRequest("End time must be after start time");
    }
  }

  if (!attendeeIds || attendeeIds.length === 0) {
    throw ApiError.badRequest("At least one attendee must be selected");
  }

  const uniqueAttendeeIds = Array.from(new Set(attendeeIds));

  // Verify all attendee IDs are valid interns
  const validInterns = await prisma.user.findMany({
    where: {
      id: { in: uniqueAttendeeIds },
      role: 'INTERN',
    },
    select: { id: true },
  });

  if (validInterns.length !== uniqueAttendeeIds.length) {
    throw ApiError.badRequest("One or more selected attendees are invalid interns");
  }

  const meeting = await prisma.meeting.create({
    data: {
      title,
      description,
      type: type || 'ONE_ON_ONE',
      startsAt: starts,
      endsAt: ends,
      location,
      meetingLink,
      organizerId: req.user.id,
      attendees: {
        create: uniqueAttendeeIds.map((uid) => ({ userId: uid, response: 'PENDING' })),
      },
    },
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  await Promise.all(
    uniqueAttendeeIds.map((uid) =>
      notify(uid, {
        type: 'meeting',
        title: `Meeting Scheduled: ${title}`,
        body: description?.slice(0, 200) || `Organizer: ${req.user.name}`,
        link: `/calendar`,
      })
    )
  );

  await audit({
    userId: req.user.id,
    action: 'meeting.create',
    resource: 'meeting',
    resourceId: meeting.id,
    req,
  });

  res.status(201).json({ meeting });
});

// ── GET /meetings/my — Intern gets meetings where they are an attendee ──
export const listMyMeetings = asyncHandler(async (req, res) => {
  const items = await prisma.meeting.findMany({
    where: {
      attendees: { some: { userId: req.user.id } },
    },
    orderBy: { startsAt: 'asc' },
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });
  res.json({ items });
});

// ── GET /meetings/organized — Mentor gets meetings they organized ──
export const listOrganizedMeetings = asyncHandler(async (req, res) => {
  const items = await prisma.meeting.findMany({
    where: {
      organizerId: req.user.id,
    },
    orderBy: { startsAt: 'asc' },
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });
  res.json({ items });
});

// ── GET /meetings/:id — Get details of a single meeting ──
export const getMeetingDetails = asyncHandler(async (req, res) => {
  const id = req.validatedParams?.id || req.params.id;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });

  if (!meeting) {
    throw ApiError.notFound("Meeting not found");
  }

  const isOrganizer = meeting.organizerId === req.user.id;
  const isAttendee = meeting.attendees.some((a) => a.userId === req.user.id);
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);

  if (!isOrganizer && !isAttendee && !isAdmin) {
    throw ApiError.forbidden("Not authorized to view this meeting");
  }

  res.json({ meeting });
});

// ── PATCH /meetings/:id — Mentor edits a meeting ──
export const editMeeting = asyncHandler(async (req, res) => {
  const id = req.validatedParams?.id || req.params.id;
  const { title, description, startsAt, endsAt, location, meetingLink, type, attendeeIds } = req.body;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { attendees: true },
  });

  if (!meeting) {
    throw ApiError.notFound("Meeting not found");
  }

  if (meeting.organizerId !== req.user.id && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    throw ApiError.forbidden("Not authorized to edit this meeting");
  }

  const starts = startsAt ? new Date(startsAt) : meeting.startsAt;
  if (startsAt && isNaN(starts.getTime())) {
    throw ApiError.badRequest("Invalid start date");
  }

  let ends = endsAt ? new Date(endsAt) : meeting.endsAt;
  if (endsAt && isNaN(ends.getTime())) {
    throw ApiError.badRequest("Invalid end date");
  }

  if (ends && ends <= starts) {
    throw ApiError.badRequest("End time must be after start time");
  }

  const updateData = {
    title: title !== undefined ? title : meeting.title,
    description: description !== undefined ? description : meeting.description,
    startsAt: starts,
    endsAt: ends,
    location: location !== undefined ? location : meeting.location,
    meetingLink: meetingLink !== undefined ? meetingLink : meeting.meetingLink,
    type: type !== undefined ? type : meeting.type,
  };

  if (attendeeIds !== undefined) {
    const uniqueAttendeeIds = Array.from(new Set(attendeeIds));
    const validInterns = await prisma.user.findMany({
      where: {
        id: { in: uniqueAttendeeIds },
        role: 'INTERN',
      },
      select: { id: true },
    });
    if (validInterns.length !== uniqueAttendeeIds.length) {
      throw ApiError.badRequest("One or more selected attendees are invalid interns");
    }

    updateData.attendees = {
      deleteMany: {},
      create: uniqueAttendeeIds.map((uid) => ({ userId: uid, response: 'PENDING' })),
    };
  }

  const updated = await prisma.meeting.update({
    where: { id },
    data: updateData,
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });

  await audit({
    userId: req.user.id,
    action: 'meeting.edit',
    resource: 'meeting',
    resourceId: id,
    req,
  });

  res.json({ meeting: updated });
});

// ── DELETE /meetings/:id — Mentor cancels/deletes a meeting ──
export const deleteMeeting = asyncHandler(async (req, res) => {
  const id = req.validatedParams?.id || req.params.id;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
  });

  if (!meeting) {
    throw ApiError.notFound("Meeting not found");
  }

  if (meeting.organizerId !== req.user.id && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    throw ApiError.forbidden("Not authorized to cancel this meeting");
  }

  await prisma.meeting.delete({
    where: { id },
  });

  await audit({
    userId: req.user.id,
    action: 'meeting.delete',
    resource: 'meeting',
    resourceId: id,
    req,
  });

  res.json({ ok: true });
});

// ── PATCH /meetings/:id/rsvp — Intern accepts or declines RSVP ──
export const updateRsvp = asyncHandler(async (req, res) => {
  const id = req.validatedParams?.id || req.params.id;
  const { response } = req.body;

  if (!['ACCEPTED', 'DECLINED'].includes(response)) {
    throw ApiError.badRequest("Response must be ACCEPTED or DECLINED");
  }

  const attendee = await prisma.meetingAttendee.findUnique({
    where: {
      meetingId_userId: {
        meetingId: id,
        userId: req.user.id,
      },
    },
    include: {
      meeting: {
        include: {
          organizer: true,
        },
      },
    },
  });

  if (!attendee) {
    throw ApiError.notFound("Meeting attendee record not found or you are not invited");
  }

  const updated = await prisma.meetingAttendee.update({
    where: {
      meetingId_userId: {
        meetingId: id,
        userId: req.user.id,
      },
    },
    data: { response },
  });

  await notify(attendee.meeting.organizerId, {
    type: 'meeting_rsvp',
    title: `Meeting RSVP Update`,
    body: `${req.user.name} has ${response.toLowerCase()} your meeting: "${attendee.meeting.title}"`,
    link: `/calendar`,
  });

  await audit({
    userId: req.user.id,
    action: 'meeting.rsvp',
    resource: 'meetingAttendee',
    resourceId: updated.id,
    meta: { meetingId: id, response },
    req,
  });

  res.json({ attendee: updated });
});
