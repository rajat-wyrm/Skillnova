const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
async function routes(fastify) {
  fastify.get('/sync-status', { preHandler:[auth, rbac('ADMIN')] }, async ()=>({ status:'not_implemented' }));
}
module.exports = routes;
