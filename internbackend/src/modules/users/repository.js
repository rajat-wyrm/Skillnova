const pool = require('../../config/db');
async function listUsersByRole(role) {
  return pool.query('SELECT id,email,role,full_name,suspended FROM users WHERE deleted_at IS NULL AND role=$1', [role]);
}
async function getUserById(id) {
  return pool.query(
    `SELECT id, email, role, full_name, suspended, avatar_url, created_at,
            department_id, phone, college, course, year_of_study, position,
            joining_date, internship_status, location, notes
     FROM users WHERE id=$1 AND deleted_at IS NULL`,
    [id]
  );
}
async function suspendUser(id) { await pool.query('UPDATE users SET suspended=TRUE, updated_at=NOW() WHERE id=$1', [id]); }
async function activateUser(id) { await pool.query('UPDATE users SET suspended=FALSE, updated_at=NOW() WHERE id=$1', [id]); }
async function softDeleteUser(id) { await pool.query('UPDATE users SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1', [id]); }
module.exports = { listUsersByRole, getUserById, suspendUser, activateUser, softDeleteUser };
