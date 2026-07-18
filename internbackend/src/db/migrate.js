const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Ensure tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const dir = path.resolve(__dirname, '../../migrations');
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const alreadyApplied = await client.query(
        'SELECT 1 FROM _migrations WHERE name = $1',
        [file]
      );
      if (alreadyApplied.rowCount > 0) {
        console.log(`Skipping (already applied): ${file}`);
        continue;
      }

      const filePath = path.join(dir, file);
      let sql;
      try {
        // Read as UTF-8, handle potential BOM
        const buffer = fs.readFileSync(filePath);
        if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
          sql = buffer.toString('utf8', 3); // skip BOM
        } else {
          sql = buffer.toString('utf8');
        }
      } catch (readErr) {
        throw new Error(`Failed to read ${file}: ${readErr.message}`);
      }

      try {
        await client.query(sql);
        console.log(`Migration applied: ${file}`);
        await client.query(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [file]
        );
      } catch (execErr) {
        // Show detailed error with the file that failed
        throw new Error(
          `Migration failed in file "${file}": ${execErr.message}\nSQL:\n${sql.substring(0, 500)}...`
        );
      }
    }

    await client.query('COMMIT');
    console.log('All pending migrations applied successfully.');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Migration error:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate().then(() => process.exit(0));