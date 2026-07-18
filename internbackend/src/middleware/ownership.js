const { checkHierarchyAccess } = require('../utils/hierarchy');
function ownership(paramName = 'id') {
  // Returns an async preHandler with only 2 args (no done)
  return async (request, reply) => {
    const target = request.params[paramName] || request.body?.user_id;
    if (!target) return reply.status(400).send({ error: 'Missing target' });
    if (request.user.role === 'ADMIN') return; // admin bypass
    const ok = await checkHierarchyAccess(request.user.id, target);
    if (!ok) return reply.status(403).send({ error: 'Not in your hierarchy' });
  };
}
module.exports = ownership;