const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const repo = require('./repository');

async function routes(fastify) {
  fastify.get('/attendance-csv', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async (req, reply) => {
    const { from, to } = req.query;
    if (!from || !to) throw new Error('from and to dates required');
    const data = await repo.attendanceSummaryByRole(from, to);
    const csv = ['Role,Status,Count'].concat(data.map(r => `${r.role},${r.status},${r.count}`)).join('\n');
    reply.header('Content-Type', 'text/csv').header('Content-Disposition', 'attachment; filename=attendance.csv').send(csv);
  });

  fastify.get('/ratings-csv', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async (req, reply) => {
    const { from, to } = req.query;
    if (!from || !to) throw new Error('from and to dates required');
    const data = await repo.ratingsSummary(from, to);
    const csv = ['Role,Average Score,Total Ratings'].concat(data.map(r => `${r.role},${parseFloat(r.avg_score).toFixed(2)},${r.total}`)).join('\n');
    reply.header('Content-Type', 'text/csv').header('Content-Disposition', 'attachment; filename=ratings.csv').send(csv);
  });

  fastify.get('/tasks-csv', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async (req, reply) => {
    const data = await repo.taskCompletionStats();
    const csv = ['Task Title,Verified,Pending'].concat(data.map(t => `"${t.title}",${t.verified},${t.pending}`)).join('\n');
    reply.header('Content-Type', 'text/csv').header('Content-Disposition', 'attachment; filename=tasks.csv').send(csv);
  });
}

module.exports = routes;
