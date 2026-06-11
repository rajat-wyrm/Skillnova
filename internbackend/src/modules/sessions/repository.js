const pool = require('../../config/db');

async function getUserSessions(userId) {
  const res = await pool.query(
    `SELECT id, token_hash, created_at, expires_at, revoked
     FROM refresh_tokens
     WHERE user_id = $1 AND revoked = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows.map(row => ({
    sessionId: row.id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    // token_hash omitted for security
  }));
}

async function revokeSession(sessionId, userId) {
  const res = await pool.query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
    [sessionId, userId]
  );
  return res.rowCount > 0;
}

async function revokeAllUserSessions(userId) {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE', [userId]);
}

module.exports = { getUserSessions, revokeSession, revokeAllUserSessions };
