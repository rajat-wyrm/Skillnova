// ════════════════════════════════════════════════════════════
//  Meeting Routes — scheduling, RSVPs, details, deletion
// ════════════════════════════════════════════════════════════
import { Router } from "express";
import { z } from "zod";
import * as meetings from "../controllers/meeting.controller.js";
import { requirePermission } from "../middleware/rbac.js";
import { validate, schemas } from "../middleware/validate.js";

const router = Router();

const idParam = z.object({ id: z.string().cuid() });

const meetingCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  attendeeIds: z.array(z.string().cuid()).default([]),
  location: z.string().max(200).optional(),
  meetingLink: z.string().url("Invalid meeting link format").or(z.string().length(0)).optional().nullable(),
  type: z.enum(['STANDUP', 'ONE_ON_ONE', 'REVIEW', 'TRAINING', 'OTHER']).default('ONE_ON_ONE'),
});

const meetingEditSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  attendeeIds: z.array(z.string().cuid()).optional(),
  location: z.string().max(200).optional(),
  meetingLink: z.string().url("Invalid meeting link format").or(z.string().length(0)).optional().nullable(),
  type: z.enum(['STANDUP', 'ONE_ON_ONE', 'REVIEW', 'TRAINING', 'OTHER']).optional(),
});

const rsvpSchema = z.object({
  response: z.enum(['ACCEPTED', 'DECLINED']),
});

// ── Endpoints ──────────────────────────────────────────────

router.get(
  "/",
  requirePermission("meetings:read"),
  validate(schemas.pagination, "query"),
  meetings.listMeetings
);

router.post(
  "/",
  requirePermission("meetings:write"),
  validate(meetingCreateSchema),
  meetings.createMeeting
);

router.get(
  "/my",
  requirePermission("meetings:read"),
  meetings.listMyMeetings
);

router.get(
  "/organized",
  requirePermission("meetings:read"),
  meetings.listOrganizedMeetings
);

router.get(
  "/:id",
  requirePermission("meetings:read"),
  validate(idParam, "params"),
  meetings.getMeetingDetails
);

router.patch(
  "/:id",
  requirePermission("meetings:write"),
  validate(idParam, "params"),
  validate(meetingEditSchema),
  meetings.editMeeting
);

router.delete(
  "/:id",
  requirePermission("meetings:delete"),
  validate(idParam, "params"),
  meetings.deleteMeeting
);

router.patch(
  "/:id/rsvp",
  requirePermission("meetings:read"),
  validate(idParam, "params"),
  validate(rsvpSchema),
  meetings.updateRsvp
);

export default router;
