// ════════════════════════════════════════════════════════════
//  Leave Requests Controller
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { emitToRoom } from '../sockets/index.js';

const toDayStart = (value) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getDateRange = (startDate, endDate) => {
  const dates = [];
  const cursor = toDayStart(startDate);
  const end = toDayStart(endDate);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

const getBaseWhere = async (req) => {
  if (req.user.role === 'INTERN') return { userId: req.user.id };

  if (req.user.role === 'MENTOR') {
    const interns = await prisma.user.findMany({
      where: { role: 'INTERN', internProfile: { mentorId: req.user.id } },
      select: { id: true },
    });
    const internIds = interns.map((intern) => intern.id);

    if (req.query.userId) {
      return internIds.includes(req.query.userId) ? { userId: req.query.userId } : { userId: '__no_match__' };
    }

    return { userId: { in: internIds } };
  }

  return req.query.userId ? { userId: req.query.userId } : {};
};

export const list = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'createdAt', order } = req.validatedQuery;
  const where = await getBaseWhere(req);

  if (req.query.status) where.status = req.query.status;

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, department: true, avatarUrl: true } },
        reviewer: { select: { id: true, name: true } },
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const create = asyncHandler(async (req, res) => {
  const startDate = toDayStart(req.body.startDate);
  const endDate = toDayStart(req.body.endDate);

  if (startDate > endDate) {
    throw ApiError.badRequest('End date must be on or after the start date.');
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId: req.user.id,
      leaveType: req.body.leaveType.trim(),
      startDate,
      endDate,
      reason: req.body.reason.trim(),
    },
    include: {
      user: { select: { id: true, name: true, department: true, avatarUrl: true } },
    },
  });

  await audit({ userId: req.user.id, action: 'leave_request.create', resource: 'leave_request', resourceId: leaveRequest.id, req });

  const profile = await prisma.internProfile.findUnique({ where: { userId: req.user.id } });
  if (profile?.mentorId) {
    await notify(profile.mentorId, {
      type: 'leave',
      title: `${req.user.name} requested leave`,
      body: `${leaveRequest.leaveType} - ${req.body.reason.trim().slice(0, 80)}`,
      link: '/mentor/leave-approvals',
    });
  }

  emitToRoom(`role:MENTOR`, 'dashboard:refresh', {});
  res.status(201).json({ leaveRequest });
});

export const review = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const { status, reviewerNote } = req.body;

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  if (!leaveRequest) throw ApiError.notFound('Leave request not found');

  if (leaveRequest.status !== 'PENDING') {
    throw ApiError.badRequest('This leave request has already been reviewed.');
  }

  if (req.user.role === 'MENTOR') {
    const intern = await prisma.internProfile.findFirst({
      where: { userId: leaveRequest.userId, mentorId: req.user.id },
    });
    if (!intern) throw ApiError.forbidden('You can only review leave requests for your interns.');
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      reviewerId: req.user.id,
      reviewerNote: reviewerNote?.trim() || null,
      reviewedAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true, department: true, avatarUrl: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });

  if (status === 'APPROVED') {
    const dates = getDateRange(updated.startDate, updated.endDate);
    const existing = await prisma.attendance.findMany({
      where: {
        userId: updated.userId,
        date: { in: dates },
      },
    });

    const existingByDate = new Map(existing.map((item) => [toDayStart(item.date).toISOString(), item]));
    const operations = dates
      .filter((date) => {
        const current = existingByDate.get(toDayStart(date).toISOString());
        return !(current?.checkIn || current?.checkOut || current?.status === 'PRESENT');
      })
      .map((date) =>
        prisma.attendance.upsert({
          where: { userId_date: { userId: updated.userId, date } },
          update: {
            status: 'LEAVE',
            notes: `${updated.leaveType} leave approved`,
            markedById: req.user.id,
            checkIn: null,
            checkOut: null,
          },
          create: {
            userId: updated.userId,
            date,
            status: 'LEAVE',
            notes: `${updated.leaveType} leave approved`,
            markedById: req.user.id,
          },
        })
      );

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }
  }

  await audit({
    userId: req.user.id,
    action: 'leave_request.review',
    resource: 'leave_request',
    resourceId: updated.id,
    meta: { status },
    req,
  });

  await notify(updated.userId, {
    type: 'leave',
    title: `Your leave request was ${status.toLowerCase()}`,
    body: `${updated.leaveType} leave request`,
    link: '/attendance',
  });

  emitToRoom(`user:${updated.userId}`, 'dashboard:refresh', {});
  emitToRoom(`role:MENTOR`, 'dashboard:refresh', {});
  res.json({ leaveRequest: updated });
});

export default { list, create, review };
