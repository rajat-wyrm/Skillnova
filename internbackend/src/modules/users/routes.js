const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const ownership = require('../../middleware/ownership');
const repo = require('./repository');
const { createAuditLog } = require('../../utils/audit');
const argon2 = require('argon2');
const { z } = require('zod');
const authRepo = require('../auth/repository');

async function routes(fastify) {
  // Admin: list users
  fastify.get('/', { preHandler: [auth, rbac('ADMIN')] }, async (req) => {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE deleted_at IS NULL';
    if (role) { where += ` AND role = $${params.length+1}`; params.push(role); }
    const { rows } = await require('../../config/db').query(
      `SELECT id, email, role, full_name, suspended, avatar_url, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    return rows;
  });

  // Get own profile
  fastify.get('/me', { preHandler: [auth] }, async (req) => {
    const { rows: [user] } = await repo.getUserById(req.user.id);
    return user;
  });

  // Get single user (ownership check)
  fastify.get('/:id', { preHandler: [auth, ownership('id')] }, async (req, reply) => {
    const { rows: [user] } = await repo.getUserById(req.params.id);
    return user || reply.status(404).send({ error: 'Not found' });
  });

  // Suspend / Activate / Soft delete (admin only)
  fastify.patch('/:id/suspend', { preHandler: [auth, rbac('ADMIN')] }, async (req) => {
    await repo.suspendUser(req.params.id);
    await createAuditLog({ userId: req.user.id, action: 'USER_SUSPENDED', resourceType: 'user', resourceId: req.params.id });
    return { message: 'Suspended' };
  });
  fastify.patch('/:id/activate', { preHandler: [auth, rbac('ADMIN')] }, async (req) => {
    await repo.activateUser(req.params.id);
    await createAuditLog({ userId: req.user.id, action: 'USER_ACTIVATED', resourceType: 'user', resourceId: req.params.id });
    return { message: 'Activated' };
  });
  fastify.delete('/:id', { preHandler: [auth, rbac('ADMIN')] }, async (req) => {
    await repo.softDeleteUser(req.params.id);
    await createAuditLog({ userId: req.user.id, action: 'USER_DELETED', resourceType: 'user', resourceId: req.params.id });
    return { message: 'Soft-deleted' };
  });

  // Change own password
  fastify.patch('/me/password', { preHandler: [auth] }, async (req, reply) => {
    const schema = z.object({ oldPassword: z.string(), newPassword: z.string().min(8) });
    const { oldPassword, newPassword } = schema.parse(req.body);
    const user = await authRepo.findById(req.user.id);
    if (!user) return reply.status(404).send({ error: 'User not found' });
    const valid = await authRepo.verifyPassword(user, oldPassword);
    if (!valid) return reply.status(400).send({ error: 'Current password is incorrect' });
    const newHash = await argon2.hash(newPassword);
    await authRepo.updatePassword(req.user.id, newHash);
    await createAuditLog({ userId: req.user.id, action: 'PASSWORD_CHANGED', resourceType: 'user', resourceId: req.user.id });
    return { message: 'Password updated' };
  });

  // Update own profile
  fastify.patch('/me', { preHandler: [auth] }, async (req) => {
    const schema = z.object({ full_name: z.string().optional() });
    const data = schema.parse(req.body);
    await authRepo.updateProfile(req.user.id, data);
    return { message: 'Profile updated' };
  });
}

module.exports = routes;
