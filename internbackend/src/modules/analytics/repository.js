const pool = require('../../config/db');

async function departmentAttendanceRate(departmentId, month, year) {
  const res = await pool.query(`
    SELECT u.id, u.full_name, u.email,
      COUNT(a.id) FILTER (WHERE a.status='PRESENT') as present,
      COUNT(a.id) FILTER (WHERE a.status='ABSENT') as absent,
      COUNT(a.id) FILTER (WHERE a.status='HALF_DAY') as half_day,
      COUNT(a.id) as total_marked
    FROM users u
    LEFT JOIN attendance a ON u.id = a.user_id AND EXTRACT(MONTH FROM a.date)=$2 AND EXTRACT(YEAR FROM a.date)=$3 AND a.deleted_at IS NULL
    WHERE u.department_id=$1 AND u.deleted_at IS NULL AND u.role='INTERN'
    GROUP BY u.id, u.full_name, u.email
  `, [departmentId, month, year]);
  return res.rows;
}

async function topPerformers(role, limit = 10) {
  const res = await pool.query(`
    SELECT u.id, u.full_name, u.email, AVG(r.score) as avg_rating, COUNT(r.id) as total_ratings
    FROM users u
    JOIN ratings r ON u.id = r.rated_user_id AND r.deleted_at IS NULL
    WHERE u.role=$1 AND u.deleted_at IS NULL
    GROUP BY u.id
    ORDER BY avg_rating DESC
    LIMIT $2
  `, [role, limit]);
  return res.rows;
}

async function attendanceTrends(months = 6) {
  // Aggregate attendance by month for the last N months
  const res = await pool.query(`
    SELECT TO_CHAR(date,'YYYY-MM') as month, status, COUNT(*) as count
    FROM attendance
    WHERE deleted_at IS NULL
      AND date >= date_trunc('month', CURRENT_DATE) - make_interval(months => $1::int)
    GROUP BY TO_CHAR(date,'YYYY-MM'), status
    ORDER BY month, status
  `, [months]);
  return res.rows;
}

module.exports = { departmentAttendanceRate, topPerformers, attendanceTrends };
