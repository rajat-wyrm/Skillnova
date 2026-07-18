const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const pool = require('../../config/db');
async function routes(fastify) {
  fastify.get('/', { preHandler:[auth, rbac('ADMIN')] }, async ()=> (await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100')).rows);
}
module.exports = routes;
