const pool = require('../../config/db');

async function attendanceSummaryByRole(from, to) {
  const res = await pool.query(`
    SELECT u.role, a.status, COUNT(*) as count
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE a.date BETWEEN $1 AND $2 AND a.deleted_at IS NULL
    GROUP BY u.role, a.status
  `, [from, to]);
  return res.rows;
}

async function ratingsSummary(from, to) {
  const res = await pool.query(`
    SELECT u.role, AVG(r.score) as avg_score, COUNT(*) as total
    FROM ratings r
    JOIN users u ON r.rated_user_id = u.id
    WHERE r.created_at BETWEEN $1 AND $2 AND r.deleted_at IS NULL
    GROUP BY u.role
  `, [from, to]);
  return res.rows;
}

async function taskCompletionStats() {
  const res = await pool.query(`
    SELECT t.id, t.title, COUNT(p.id) FILTER (WHERE p.status='VERIFIED') as verified,
           COUNT(p.id) FILTER (WHERE p.status='PENDING') as pending
    FROM social_tasks t
    LEFT JOIN proof_submissions p ON t.id = p.task_id AND p.deleted_at IS NULL
    WHERE t.deleted_at IS NULL
    GROUP BY t.id, t.title
  `);
  return res.rows;
}

module.exports = { attendanceSummaryByRole, ratingsSummary, taskCompletionStats };
