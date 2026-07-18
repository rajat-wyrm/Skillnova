const pool = require('../../config/db');
async function getDirectReports(managerId) {
  const res = await pool.query('SELECT id, email, role, full_name, suspended FROM users WHERE manager_id = $1 AND deleted_at IS NULL', [managerId]);
  return res.rows;
}
async function getFullTeam(userId) {
  const query = `
    WITH RECURSIVE team AS (
      SELECT id, email, role, full_name, manager_id, 1 AS depth
      FROM users WHERE manager_id = $1 AND deleted_at IS NULL
      UNION ALL
      SELECT u.id, u.email, u.role, u.full_name, u.manager_id, t.depth + 1
      FROM users u INNER JOIN team t ON u.manager_id = t.id
      WHERE u.deleted_at IS NULL
    )
    SELECT id, email, role, full_name, manager_id, depth FROM team ORDER BY depth, role, full_name
  `;
  const res = await pool.query(query, [userId]);
  return res.rows;
}
async function getUpwardChain(userId) {
  const query = `
    WITH RECURSIVE chain AS (
      SELECT id, email, role, full_name, manager_id FROM users WHERE id = $1 AND deleted_at IS NULL
      UNION ALL
      SELECT u.id, u.email, u.role, u.full_name, u.manager_id FROM users u INNER JOIN chain c ON u.id = c.manager_id WHERE u.deleted_at IS NULL
    )
    SELECT id, email, role, full_name FROM chain
  `;
  const res = await pool.query(query, [userId]);
  return res.rows;
}
module.exports = { getDirectReports, getFullTeam, getUpwardChain };
