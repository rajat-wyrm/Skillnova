const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const repo = require('./repository');
const { createAuditLog, extractRequestInfo } = require('../../utils/audit');

async function routes(fastify) {
  // List own sessions
  fastify.get('/me', { preHandler: [auth] }, async (req) => {
    return repo.getUserSessions(req.user.id);
  });

  // Revoke a specific session
  fastify.delete('/me/:sessionId', { preHandler: [auth] }, async (req, reply) => {
    const success = await repo.revokeSession(req.params.sessionId, req.user.id);
    if (!success) return reply.status(404).send({ error: 'Session not found' });
    await createAuditLog({
      userId: req.user.id,
      action: 'SESSION_REVOKED',
      resourceType: 'session',
      resourceId: req.params.sessionId,
      ...extractRequestInfo(req),
    });
    return { message: 'Session revoked' };
  });

  // Revoke all other sessions
  fastify.post('/me/revoke-all', { preHandler: [auth] }, async (req) => {
    await repo.revokeAllUserSessions(req.user.id);
    await createAuditLog({
      userId: req.user.id,
      action: 'ALL_SESSIONS_REVOKED',
      resourceType: 'session',
      ...extractRequestInfo(req),
    });
    return { message: 'All sessions revoked. Please re-login.' };
  });

  // Admin: revoke all sessions of a specific user
  fastify.post('/admin/revoke-user/:userId', { preHandler: [auth, rbac('ADMIN')] }, async (req, reply) => {
    const { userId } = req.params;
    await require('../auth/repository').revokeAllUserTokensRedis(userId);
    await createAuditLog({
      userId: req.user.id,
      action: 'ADMIN_REVOKED_USER_SESSIONS',
      resourceType: 'session',
      resourceId: userId,
      ...extractRequestInfo(req),
    });
    return { message: `All sessions for user ${userId} revoked` };
  });
}

module.exports = routes;
