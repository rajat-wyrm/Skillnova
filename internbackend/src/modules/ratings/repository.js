const pool = require('../../config/db');
async function addRating(rated, by, score, remarks) {
  const res = await pool.query(
    'INSERT INTO ratings (rated_user_id, rated_by, score, remarks) VALUES ($1,$2,$3,$4) RETURNING *',
    [rated,by,score,remarks]
  );
  return res.rows[0];
}
async function getRatings(userId) {
  const res = await pool.query('SELECT * FROM ratings WHERE rated_user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC', [userId]);
  return res.rows;
}
module.exports = { addRating, getRatings };
