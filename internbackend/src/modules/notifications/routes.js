const auth = require('../../middleware/auth');
const repo = require('./repository');
const { z } = require('zod');

async function routes(fastify) {
  // Get notifications with pagination
  fastify.get('/', { preHandler: [auth] }, async (req) => {
    const schema = z.object({
      page: z.string().optional().transform(v => parseInt(v || '1')),
      limit: z.string().optional().transform(v => parseInt(v || '20'))
    });
    const query = schema.parse(req.query);
    return repo.get(req.user.id, query);
  });

  // Mark single as read
  fastify.patch('/:id/read', { preHandler: [auth] }, async (req) => {
    await repo.markRead(req.params.id, req.user.id);
    return { success: true };
  });

  // Mark all as read
  fastify.post('/read-all', { preHandler: [auth] }, async (req) => {
    await repo.markAllRead(req.user.id);
    return { success: true };
  });

  // Delete a notification
  fastify.delete('/:id', { preHandler: [auth] }, async (req) => {
    await repo.deleteNotification(req.params.id, req.user.id);
    return { success: true };
  });

  // Unread count (useful for badges)
  fastify.get('/unread-count', { preHandler: [auth] }, async (req) => {
    const count = await repo.getUnreadCount(req.user.id);
    return { unread: count };
  });
}

module.exports = routes;
