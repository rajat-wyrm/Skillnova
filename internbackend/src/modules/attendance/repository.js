const pool = require('../../config/db');

async function markAttendance(userId, markedBy, date, status, remarks) {
  const res = await pool.query(
    `INSERT INTO attendance (user_id, marked_by, date, status, remarks)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (user_id, date)
     DO UPDATE SET status=$4, marked_by=$2, remarks=$5, updated_at=NOW()
     RETURNING *`,
    [userId, markedBy, date, status, remarks || null]
  );
  return res.rows[0];
}

async function getAttendance(userId, from, to) {
  let q = 'SELECT * FROM attendance WHERE user_id=$1 AND deleted_at IS NULL';
  const params = [userId];
  if (from) { q += ' AND date>=$2'; params.push(from); }
  if (to) { q += ' AND date<=$'+(params.length+1); params.push(to); }
  const res = await pool.query(q, params);
  return res.rows;
}

async function getMonthlyStats(userId, month, year) {
  const res = await pool.query(
    `SELECT status, COUNT(*) as count
     FROM attendance
     WHERE user_id=$1 AND EXTRACT(MONTH FROM date)=$2 AND EXTRACT(YEAR FROM date)=$3 AND deleted_at IS NULL
     GROUP BY status`,
    [userId, month, year]
  );
  return res.rows;
}

async function bulkMark(entries, markedBy) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = [];
    for (const e of entries) {
      const r = await client.query(
        `INSERT INTO attendance (user_id, marked_by, date, status, remarks)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id, date)
         DO UPDATE SET status=$4, marked_by=$2, remarks=$5, updated_at=NOW()
         RETURNING *`,
        [e.user_id, markedBy, e.date, e.status, e.remarks || null]
      );
      out.push(r.rows[0]);
    }
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { markAttendance, getAttendance, getMonthlyStats, bulkMark };
