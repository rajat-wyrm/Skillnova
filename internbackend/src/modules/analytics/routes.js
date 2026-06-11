const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const repo = require('./repository');

async function routes(fastify) {
  fastify.get('/overview', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async () => {
    const pool = require('../../config/db');
    const counts = await pool.query("SELECT role, COUNT(*) FROM users WHERE deleted_at IS NULL GROUP BY role");
    return { users: counts.rows };
  });

  // Department attendance rate (admin/senior TL)
  fastify.get('/department-attendance', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async (req) => {
    const { departmentId, month, year } = req.query;
    if (!departmentId || !month || !year) throw new Error('departmentId, month, year required');
    return repo.departmentAttendanceRate(departmentId, month, year);
  });

  // Top performers
  fastify.get('/top-performers', { preHandler: [auth, rbac('ADMIN','SENIOR_TL','TL')] }, async (req) => {
    const { role = 'INTERN', limit = 10 } = req.query;
    return repo.topPerformers(role, limit);
  });

  // Attendance trends
  fastify.get('/attendance-trends', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async (req) => {
    const { months = 6 } = req.query;
    return repo.attendanceTrends(months);
  });
}

module.exports = routes;
