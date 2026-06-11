const pool = require('../../config/db');
const argon2 = require('argon2');

async function createUser({ email, password, role, managerId, departmentId, fullName }) {
  const hash = await argon2.hash(password);
  const res = await pool.query(
    `INSERT INTO users (email, password_hash, role, manager_id, department_id, full_name)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,email,role,manager_id,department_id,full_name,suspended,created_at`,
    [email,hash,role,managerId,departmentId,fullName]
  );
  return res.rows[0];
}

async function findByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email=$1 AND deleted_at IS NULL', [email]);
  return res.rows[0] || null;
}

async function findById(id) {
  const res = await pool.query('SELECT * FROM users WHERE id=$1 AND deleted_at IS NULL', [id]);
  return res.rows[0] || null;
}

async function verifyPassword(user, password) { return argon2.verify(user.password_hash, password); }

async function storeRefreshToken(userId, tokenHash, expiresAt) {
  await pool.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)', [userId,tokenHash,expiresAt]);
}

async function revokeRefreshToken(tokenHash) {
  await pool.query('UPDATE refresh_tokens SET revoked=TRUE WHERE token_hash=$1', [tokenHash]);
}

async function revokeAllUserTokens(userId) {
  await pool.query('UPDATE refresh_tokens SET revoked=TRUE WHERE user_id=$1', [userId]);
}

async function updatePassword(userId, newHash) {
  await pool.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [newHash, userId]);
}

async function updateProfile(userId, fields) {
  const set = [];
  const vals = [];
  let idx = 1;
  for (const [key, val] of Object.entries(fields)) {
    if (['full_name'].includes(key)) {
      set.push(`${key} = $${idx}`);
      vals.push(val);
      idx++;
    }
  }
  if (set.length === 0) return;
  vals.push(userId);
  await pool.query(`UPDATE users SET ${set.join(', ')}, updated_at = NOW() WHERE id = $${idx}`, vals);
}

// Redis integration fallback functions
const { getRedisClient } = require('../../config/redis');

async function storeRefreshTokenRedis(userId, tokenHash, expiresAt) {
  const redis = await getRedisClient();
  if (redis) {
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    await redis.set(`refresh_token:${tokenHash}`, userId, { EX: ttl });
    await redis.sAdd(`user_tokens:${userId}`, tokenHash);
    return;
  }
  await storeRefreshToken(userId, tokenHash, expiresAt);
}

async function revokeRefreshTokenRedis(tokenHash) {
  const redis = await getRedisClient();
  if (redis) {
    const userId = await redis.get(`refresh_token:${tokenHash}`);
    if (userId) {
      await redis.del(`refresh_token:${tokenHash}`);
      await redis.sRem(`user_tokens:${userId}`, tokenHash);
    }
    return;
  }
  await revokeRefreshToken(tokenHash);
}

async function revokeAllUserTokensRedis(userId) {
  const redis = await getRedisClient();
  if (redis) {
    const tokens = await redis.sMembers(`user_tokens:${userId}`);
    for (const token of tokens) {
      await redis.del(`refresh_token:${token}`);
    }
    await redis.del(`user_tokens:${userId}`);
    return;
  }
  await revokeAllUserTokens(userId);
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  verifyPassword,
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  updatePassword,
  updateProfile,
  storeRefreshTokenRedis,
  revokeRefreshTokenRedis,
  revokeAllUserTokensRedis
};
