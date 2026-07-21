// ════════════════════════════════════════════════════════════
//  Ratings Controller — weekly intern ratings (given by mentor)
// ════════════════════════════════════════════════════════════
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../services/audit.service.js";
import { notify } from "../services/notification.service.js";

export const rateSchema = z.object({
  score: z.number().min(0).max(5),
  comment: z.string().max(500).optional(),
});

function currentWeekStart() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}

// ── POST /interns/:internId/rating — mentor gives/edits this week's rating ──
export const giveRating = asyncHandler(async (req, res) => {
  const { internId } = req.params;
  const { score, comment } = req.body;

  const intern = await prisma.user.findUnique({ where: { id: internId } });
  if (!intern || intern.role !== "INTERN")
    throw ApiError.notFound("Intern not found");

  const weekStart = currentWeekStart();

  const [rating] = await prisma.$transaction([
    prisma.internRating.upsert({
      where: { internId_weekStart: { internId, weekStart } },
      update: { score, comment, mentorId: req.user.id },
      create: { internId, mentorId: req.user.id, weekStart, score, comment },
    }),
    prisma.user.update({ where: { id: internId }, data: { rating: score } }),
  ]);

  await audit({
    userId: req.user.id,
    action: "rating.give",
    resource: "internRating",
    resourceId: rating.id,
    meta: { internId, score, weekStart },
    req,
  });

  await notify(internId, {
    type: "info",
    title: "Your weekly rating was updated",
    body: `You've been rated ${score}/5 for this week.`,
  });

  res.json({ rating });
});

// ── GET /interns/:internId/ratings — history (mentor/admin, or the intern themselves) ──
export const listRatings = asyncHandler(async (req, res) => {
  const { internId } = req.params;

  const isSelf = req.user.id === internId;
  const isStaff = ["SUPER_ADMIN", "ADMIN", "MENTOR"].includes(req.user.role);
  if (!isSelf && !isStaff)
    throw ApiError.forbidden("Not allowed to view this history");

  const ratings = await prisma.internRating.findMany({
    where: { internId },
    orderBy: { weekStart: "desc" },
    take: 26, // ~6 months
    include: { mentor: { select: { id: true, name: true } } },
  });

  res.json({ items: ratings, current: ratings[0] ?? null });
});
