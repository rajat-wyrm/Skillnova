const pool = require('../config/db');
async function checkHierarchyAccess(requesterId, targetUserId) {
  if(requesterId === targetUserId) return true;
  const query = `WITH RECURSIVE chain AS (
    SELECT id, manager_id FROM users WHERE id = $1
    UNION ALL
    SELECT u.id, u.manager_id FROM users u INNER JOIN chain ON u.id = chain.manager_id
  ) SELECT 1 FROM chain WHERE id = $2`;
  const res = await pool.query(query, [targetUserId, requesterId]);
  return res.rowCount > 0;
}
async function isDirectManager(managerId, subordinateId) {
  const res = await pool.query('SELECT manager_id FROM users WHERE id = $1', [subordinateId]);
  return res.rows[0]?.manager_id === managerId;
}
const roleStepMap = { ADMIN:['SENIOR_TL'], SENIOR_TL:['TL'], TL:['CAPTAIN'], CAPTAIN:['INTERN'] };
function isValidStep(managerRole, subordinateRole) { return roleStepMap[managerRole]?.includes(subordinateRole)??false; }
module.exports = { checkHierarchyAccess, isDirectManager, isValidStep };
