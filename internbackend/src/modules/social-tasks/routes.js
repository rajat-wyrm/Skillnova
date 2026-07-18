'use strict';
const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const repo = require('./repository');
const { createAuditLog, extractRequestInfo } = require('../../utils/audit');
const { z } = require('zod');

module.exports = async function socialTasksRoutes(fastify) {
  // Create a social task (Admin / Senior TL).
  fastify.post('/', { schema: { tags: ['Tasks'], description: 'Create a social task' }, preHandler: [auth, rbac('ADMIN', 'SENIOR_TL')] }, async (req) => {
    const data = z.object({
      title: z.string().min(1).max(255),
      description: z.string().max(2000).optional(),
      targetPlatform: z.string().max(100).optional(),
      taskLink: z.string().max(500).optional(),
      deadline: z.string().optional(),
    }).parse(req.body);

    const task = await repo.createTask({ ...data, createdBy: req.user.id });
    await createAuditLog({
      userId: req.user.id,
      ...extractRequestInfo(req),
      action: 'TASK_CREATED',
      resourceType: 'social_task',
      resourceId: task.id,
      details: { title: task.title },
    });
    return task;
  });

  // List social tasks (any authenticated user). Optional ?deadlineBefore=ISO date.
  fastify.get('/', { schema: { tags: ['Tasks'], description: 'List social tasks' }, preHandler: [auth] }, async (req) => {
    return repo.getTasks(req.query || {});
  });
};
