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

const invalidateUser = (id) => lru.del(`user:${id}`);

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

  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
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
  const data = req.body;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await prisma.user.create({
    data: {
      ...data,
      passwordHash: hashPassword(data.password),
      emailVerified: false,
    },
    select: { id: true, email: true, name: true, role: true, status: true, department: true },
  });

  await audit({ userId: req.user.id, action: 'user.create', resource: 'user', resourceId: user.id, meta: { role: user.role }, req });
  await notify(user.id, { type: 'welcome', title: `Welcome to SkillNova, ${user.name}!`, body: 'Your account is ready.' });

  res.status(201).json({ user });
});

export const update = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const data = req.body;
  // Self-update restriction
  if (req.user.id === id && (data.role || data.status)) {
    throw ApiError.forbidden('Cannot change your own role or status');
  }
  const user = await prisma.user.update({ where: { id }, data });
  invalidateUser(id);
  await audit({ userId: req.user.id, action: 'user.update', resource: 'user', resourceId: id, meta: data, req });
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

export default { list, getById, create, update, changeRole, changeStatus, remove, stats };
