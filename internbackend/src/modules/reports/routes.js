const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const repo = require('./repository');

async function routes(fastify) {
  fastify.get('/attendance-summary', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async (req) => {
    const { from, to } = req.query;
    if (!from || !to) throw new Error('from and to dates required');
    return repo.attendanceSummaryByRole(from, to);
  });

  fastify.get('/ratings-summary', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async (req) => {
    const { from, to } = req.query;
    if (!from || !to) throw new Error('from and to dates required');
    return repo.ratingsSummary(from, to);
  });

  fastify.get('/task-completion', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async () => {
    return repo.taskCompletionStats();
  });
}

module.exports = routes;
