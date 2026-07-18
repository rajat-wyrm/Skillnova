const pool = require('../../config/db');
const crypto = require('crypto');
const argon2 = require('argon2');

async function createResetToken(userId) {
  // Remove old unused tokens for this user
  await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE', [userId]);
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await pool.query('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
    [userId, tokenHash, expires]);
  return token; // return raw token (not hashed) for email
}

async function verifyResetToken(rawToken) {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const res = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used = FALSE AND expires_at > NOW()',
    [hash]
  );
  return res.rows[0] || null;
}

async function markTokenUsed(rawToken) {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE token_hash = $1', [hash]);
}

async function updateUserPassword(userId, newPassword) {
  const hash = await argon2.hash(newPassword);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);
  // Revoke all refresh tokens to force re-login
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);
}

module.exports = { createResetToken, verifyResetToken, markTokenUsed, updateUserPassword };
