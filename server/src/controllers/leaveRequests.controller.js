// ════════════════════════════════════════════════════════════
//  Leave Requests Controller
// ════════════════════════════════════════════════════════════
import prisma from "../utils/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../services/audit.service.js";

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.validatedQuery;
  const where = {};

  if (req.user.role === "INTERN") {
    where.internId = req.user.id;
  } else if (req.user.role === "MENTOR") {
    const internIds = await prisma.internProfile.findMany({
      where: { mentorId: req.user.id },
      select: { userId: true },
    });
    where.internId = { in: internIds.map((i) => i.userId) };
    if (internIds.length === 0) {
      return res.json({ items: [], total: 0, page, limit, totalPages: 0 });
    }
  }

  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        intern: {
          select: { id: true, name: true, email: true, department: true, avatarUrl: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const create = asyncHandler(async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  const internId = req.user.id;

  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);

  if (end < start) {
    throw ApiError.badRequest("End date cannot be before start date");
  }

  const record = await prisma.leaveRequest.create({
    data: {
      internId,
      startDate: start,
      endDate: end,
      reason,
    },
    include: {
      intern: {
        select: { id: true, name: true, email: true, department: true, avatarUrl: true },
      },
    },
  });

  await audit({
    userId: req.user.id,
    action: "leave.create",
    resource: "leave",
    resourceId: record.id,
    meta: { startDate, endDate, reason },
    req,
  });

  res.status(201).json({ leaveRequest: record });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;
  const { status, comment } = req.body;

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Leave request not found");
  }
  if (existing.status !== "PENDING") {
    throw ApiError.badRequest("Leave request has already been reviewed");
  }

  const record = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      reviewComment: comment || null,
      reviewedById: req.user.id,
      reviewedAt: new Date(),
    },
    include: {
      intern: {
        select: { id: true, name: true, email: true, department: true, avatarUrl: true },
      },
      reviewedBy: {
        select: { id: true, name: true },
      },
    },
  });

  await audit({
    userId: req.user.id,
    action: `leave.${status.toLowerCase()}`,
    resource: "leave",
    resourceId: record.id,
    meta: { internId: record.internId, comment },
    req,
  });

  res.json({ leaveRequest: record });
});

export default { list, create, updateStatus };
