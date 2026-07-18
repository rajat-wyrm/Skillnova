const pool = require('../config/db');
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

async function isAccountLocked(email) {
  const windowStart = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
  const res = await pool.query(
    `SELECT COUNT(*) AS failed FROM login_attempts
     WHERE email = $1 AND success = false AND attempted_at > $2`,
    [email, windowStart]
  );
  return parseInt(res.rows[0].failed, 10) >= MAX_ATTEMPTS;
}

async function recordLoginAttempt(email, ip, success) {
  await pool.query(
    'INSERT INTO login_attempts (email, ip_address, success) VALUES ($1,$2,$3)',
    [email, ip, success]
  );
}

async function bruteForceCheck(request, reply) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  const { email } = request.body;
  if (!email) return;
  const locked = await isAccountLocked(email);
  if (locked) {
    return reply.status(429).send({ error: 'Account temporarily locked due to too many failed attempts. Please try again later.' });
  }
}

module.exports = { isAccountLocked, recordLoginAttempt, bruteForceCheck };