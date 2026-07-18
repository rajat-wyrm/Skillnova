const pool = require('../../config/db');
async function createTask({ title, description, targetPlatform, taskLink, deadline, createdBy }) {
  const res = await pool.query(
    'INSERT INTO social_tasks (title, description, target_platform, task_link, deadline, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [title,description,targetPlatform,taskLink,deadline,createdBy]
  );
  return res.rows[0];
}
async function getTasks(filters) {
  let q = 'SELECT * FROM social_tasks WHERE deleted_at IS NULL';
  const params = [];
  if(filters.deadlineBefore) { q += ' AND deadline<=$'+(params.length+1); params.push(filters.deadlineBefore); }
  q += ' ORDER BY created_at DESC';
  return (await pool.query(q, params)).rows;
}
async function submitProof(taskId, internId, imagePath) {
  const res = await pool.query('INSERT INTO proof_submissions (task_id, intern_id, image_path) VALUES ($1,$2,$3) RETURNING *', [taskId,internId,imagePath]);
  return res.rows[0];
}
async function verifyProof(proofId, verifierId) {
  const res = await pool.query("UPDATE proof_submissions SET verified_by=$1, verified_at=NOW(), status='VERIFIED' WHERE id=$2 RETURNING *", [verifierId,proofId]);
  return res.rows[0];
}
async function getProofsByTask(taskId) { return (await pool.query('SELECT * FROM proof_submissions WHERE task_id=$1 AND deleted_at IS NULL', [taskId])).rows; }
async function getProofsByIntern(internId) { return (await pool.query('SELECT * FROM proof_submissions WHERE intern_id=$1 AND deleted_at IS NULL', [internId])).rows; }
module.exports = { createTask, getTasks, submitProof, verifyProof, getProofsByTask, getProofsByIntern };
