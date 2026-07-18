const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('DB pool error:', err);
  process.exit(-1);
});

module.exports = pool;