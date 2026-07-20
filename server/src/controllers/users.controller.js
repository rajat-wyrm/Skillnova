// ════════════════════════════════════════════════════════════
//  User Controller — list, create, update, role/status mgmt
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword } from '../utils/auth.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';
import { lru } from '../utils/lru.js';
import XLSX from 'xlsx';
import fs from 'fs';

const invalidateUser = (id) => {
  lru.del(`user:${id}`);
  lru.del(`user:full:${id}`);
};

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];

export const list = asyncHandler(async (req, res) => {
  const { page, limit, sort = 'createdAt', order, search } = req.validatedQuery;
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (req.query.role) where.role = req.query.role;
  if (req.query.status) where.status = req.query.status;
  if (req.query.department) where.department = req.query.department;

  const cacheKey = `users:list:p${page}:l${limit}:s${sort}:o${order}:q${search || ''}:r${req.query.role || ''}:st${req.query.status || ''}:d${req.query.department || ''}`;
  const payload = await lru.wrap(cacheKey, 15, async () => {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        rating: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  });
  res.json(payload);
});

export const getById = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      internProfile: { include: { mentor: { select: { id: true, name: true } } } },
      mentorProfile: true,
    },
  });
  if (!user) throw ApiError.notFound('User not found');
  const { passwordHash: _ph, twoFactorSecret: _tfs, ...safe } = user;
  res.json({ user: safe });
});

export const create = asyncHandler(async (req, res) => {
  const { email, password, name, role, department } = req.body;

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const user = await prisma.$transaction(async (tx) => {

  const createdUser = await tx.user.create({
    data: {
      email,
      name,
      role,
      department,
      passwordHash: hashPassword(password),
      emailVerified: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      department: true,
    },
  });

  if (role === 'INTERN') {
    await tx.internProfile.create({
      data: {
        userId: createdUser.id,
        startDate: new Date(),
      },
    });
  }

  if (role === 'MENTOR') {
    await tx.mentorProfile.create({
      data: {
        userId: createdUser.id,
      },
    });
  }

  return createdUser;
});
  await audit({
    userId: req.user.id,
    action: 'user.create',
    resource: 'user',
    resourceId: user.id,
    meta: { role: user.role },
    req,
  });

  await notify(user.id, {
    type: 'welcome',
    title: `Welcome to SkillNova, ${user.name}!`,
    body: 'Your account is ready.',
  });

  res.status(201).json({ user });
});

export const update = asyncHandler(async (req, res) => {

  const id = req.validatedParams.id;

  // Intern can only edit self
  if (
    req.user.role === 'INTERN' &&
    req.user.id !== id
  ) {
    throw ApiError.forbidden('Cannot update another user');
  }

  const data = req.body;

  if (req.user.id === id && (data.role || data.status)) {
    throw ApiError.forbidden('Cannot change your own role or status');
  }

  const user = await prisma.user.update({
    where: { id },
    data
  });

  invalidateUser(id);

  await audit({
    userId: req.user.id,
    action: 'user.update',
    resource: 'user',
    resourceId: id,
    meta: data,
    req
  });

  res.json({ user });
});

export const changeRole = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const { role } = req.body;
  if (!ROLES.includes(role)) throw ApiError.badRequest('Invalid role');
  if (req.user.id === id) throw ApiError.forbidden('Cannot change your own role');
  if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only super-admins can grant SUPER_ADMIN');
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, role: true, name: true },
  });
  invalidateUser(id);
  await audit({ userId: req.user.id, action: 'user.role.change', resource: 'user', resourceId: id, meta: { newRole: role }, req });
  await notify(id, { type: 'role', title: `Your role was updated to ${role}`, link: '/profile' });
  res.json({ user: updated });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const { status } = req.body;
  if (!STATUSES.includes(status)) throw ApiError.badRequest('Invalid status');
  if (req.user.id === id) throw ApiError.forbidden('Cannot change your own status');
  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, status: true, name: true },
  });
  invalidateUser(id);
  await audit({ userId: req.user.id, action: 'user.status.change', resource: 'user', resourceId: id, meta: { newStatus: status }, req });
  await notify(id, { type: 'status', title: `Your account status is now ${status}` });
  res.json({ user: updated });
});

export const remove = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  if (req.user.id === id) throw ApiError.forbidden('Cannot delete yourself');
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound();
  if (target.role === 'SUPER_ADMIN') throw ApiError.forbidden('Cannot delete a super-admin');

  await prisma.user.delete({ where: { id } });
  invalidateUser(id);
  await audit({ userId: req.user.id, action: 'user.delete', resource: 'user', resourceId: id, req });
  res.json({ ok: true });
});

export const stats = asyncHandler(async (req, res) => {
  const [byRole, byStatus, total] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.user.groupBy({ by: ['status'], _count: true }),
    prisma.user.count(),
  ]);
  res.json({ total, byRole, byStatus });
});
export const importUsers = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Excel file required');
  }

  const workbook = XLSX.readFile(req.file.path);

  const sheet =
    workbook.Sheets[workbook.SheetNames[0]];

  const rows =
    XLSX.utils.sheet_to_json(sheet);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {

  if (!row.email || !row.name || !row.password) {
    skipped++;
    continue;
  }

  const role =
    String(row.role).toUpperCase();

  if (!['INTERN', 'MENTOR'].includes(role)) {
    skipped++;
    continue;
  }

  const existing =
    await prisma.user.findUnique({
      where: { email: row.email },
    });

  if (existing) {
    skipped++;
    continue;
  }

  await prisma.$transaction(async (tx) => {

    const user =
      await tx.user.create({
        data: {
          name: row.name,
          email: row.email,
          role,
          department: row.department,
          passwordHash: hashPassword(row.password),
        },
      });

    if (role === 'INTERN') {
      await tx.internProfile.create({
        data: {
          userId: user.id,
          startDate: new Date(),
        },
      });
    }

    if (role === 'MENTOR') {
      await tx.mentorProfile.create({
        data: {
          userId: user.id,
        },
      });
    }
  });

  created++;
}

  fs.unlinkSync(req.file.path);

  res.json({
    success: true,
    created,
    skipped,
  });
});

export default { list, getById, create, update, changeRole, changeStatus, remove, stats,importUsers };
