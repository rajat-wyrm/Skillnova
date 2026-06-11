const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const repo = require('./repository');
const { createAuditLog } = require('../../utils/audit');

async function routes(fastify) {
  // Create a department (Admin only)
  fastify.post('/', { preHandler: [auth, rbac('ADMIN')] }, async (req, reply) => {
    const name = (req.body?.name || '').trim();
    if (!name) return reply.status(400).send({ error: 'Name required' });
    const dept = await repo.createDepartment(name, req.user.id);
    await createAuditLog({ userId: req.user.id, action: 'DEPARTMENT_CREATED', resourceType: 'department', resourceId: dept.id });
    return dept;
  });

  // List departments (any authenticated user — needed for member forms/dropdowns)
  fastify.get('/', { preHandler: [auth] }, async () => repo.getAll());

  // Soft-delete a department (Admin only)
  fastify.delete('/:id', { preHandler: [auth, rbac('ADMIN')] }, async (req) => {
    await repo.softDelete(req.params.id);
    await createAuditLog({ userId: req.user.id, action: 'DEPARTMENT_DELETED', resourceType: 'department', resourceId: req.params.id });
    return { success: true };
  });
}
module.exports = routes;
