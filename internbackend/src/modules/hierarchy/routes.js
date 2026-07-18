const auth = require('../../middleware/auth');
const repo = require('./repository');
async function routes(fastify) {
  fastify.get('/my/direct-reports', { preHandler:[auth] }, async (req) => repo.getDirectReports(req.user.id));
  fastify.get('/my/team', { preHandler:[auth] }, async (req) => repo.getFullTeam(req.user.id));
  fastify.get('/my/chain', { preHandler:[auth] }, async (req) => repo.getUpwardChain(req.user.id));
}
module.exports = routes;
