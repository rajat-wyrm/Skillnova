require('dotenv').config();
const pool = require('../src/config/db');
const argon2 = require('argon2');

async function seedAdmin() {
  const client = await pool.connect();
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@internops.com';
    const adminPass = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
    const existing = await client.query('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [adminEmail]);
    if (existing.rowCount > 0) {
      console.log('Admin user already exists');
      return;
    }
    const hash = await argon2.hash(adminPass);
    await client.query(
      'INSERT INTO users (email, password_hash, role, full_name) VALUES ($1,$2,$3,$4)',
      [adminEmail, hash, 'ADMIN', 'System Admin']
    );
    console.log('Admin user seeded');
  } finally {
    client.release();
  }
}

seedAdmin().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
