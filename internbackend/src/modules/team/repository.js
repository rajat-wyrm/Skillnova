const pool = require('../../config/db');
const argon2 = require('argon2');

// Detail columns a manager is allowed to read for each member.
const MEMBER_COLUMNS = `
  u.id, u.email, u.role, u.full_name, u.suspended, u.avatar_url, u.created_at,
  u.department_id, u.manager_id, u.phone, u.college, u.course, u.year_of_study,
  u.position, u.joining_date, u.internship_status, u.location, u.notes
`;

// Performance summary (attendance %, avg rating, verified tasks) joined per member.
const PERFORMANCE_JOINS = `
  LEFT JOIN users m ON m.id = u.manager_id
  LEFT JOIN departments d ON d.id = u.department_id
  LEFT JOIN (
    SELECT user_id,
           COUNT(*) FILTER (WHERE status = 'PRESENT')  AS present_count,
           COUNT(*) FILTER (WHERE status = 'HALF_DAY') AS half_day_count,
           COUNT(*)                                    AS attendance_total
    FROM attendance WHERE deleted_at IS NULL GROUP BY user_id
  ) att ON att.user_id = u.id
  LEFT JOIN (
    SELECT rated_user_id, ROUND(AVG(score)::numeric, 2) AS avg_rating, COUNT(*) AS rating_count
    FROM ratings WHERE deleted_at IS NULL GROUP BY rated_user_id
  ) rat ON rat.rated_user_id = u.id
  LEFT JOIN (
    SELECT intern_id, COUNT(*) FILTER (WHERE status = 'VERIFIED') AS verified_tasks, COUNT(*) AS total_tasks
    FROM proof_submissions WHERE deleted_at IS NULL GROUP BY intern_id
  ) tsk ON tsk.intern_id = u.id
`;

const PERFORMANCE_COLUMNS = `
  m.full_name AS manager_name,
  d.name AS department_name,
  COALESCE(att.present_count, 0)   AS present_count,
  COALESCE(att.half_day_count, 0)  AS half_day_count,
  COALESCE(att.attendance_total, 0) AS attendance_total,
  rat.avg_rating,
  COALESCE(rat.rating_count, 0)    AS rating_count,
  COALESCE(tsk.verified_tasks, 0)  AS verified_tasks,
  COALESCE(tsk.total_tasks, 0)     AS total_tasks
`;

// Everyone in the requester's downward hierarchy (direct + indirect reports).
async function getTeamMembers(managerId) {
  const query = `
    WITH RECURSIVE team AS (
      SELECT id, manager_id, 1 AS depth
      FROM users WHERE manager_id = $1 AND deleted_at IS NULL
      UNION ALL
      SELECT u.id, u.manager_id, t.depth + 1
      FROM users u INNER JOIN team t ON u.manager_id = t.id
      WHERE u.deleted_at IS NULL
    )
    SELECT ${MEMBER_COLUMNS}, t.depth, ${PERFORMANCE_COLUMNS}
    FROM team t
    JOIN users u ON u.id = t.id
    ${PERFORMANCE_JOINS}
    ORDER BY t.depth, u.role, u.full_name
  `;
  const { rows } = await pool.query(query, [managerId]);
  return rows;
}

async function getMemberById(id) {
  const query = `
    SELECT ${MEMBER_COLUMNS}, ${PERFORMANCE_COLUMNS}
    FROM users u
    ${PERFORMANCE_JOINS}
    WHERE u.id = $1 AND u.deleted_at IS NULL
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

const EDITABLE_FIELDS = [
  'full_name', 'phone', 'college', 'course', 'year_of_study',
  'position', 'joining_date', 'internship_status', 'location', 'notes',
];

async function updateMember(id, data) {
  const sets = [];
  const params = [];
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) {
      params.push(data[field] === '' ? null : data[field]);
      sets.push(`${field} = $${params.length}`);
    }
  }
  if (sets.length === 0) return getMemberById(id);
  params.push(id);
  await pool.query(
    `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length} AND deleted_at IS NULL`,
    params
  );
  return getMemberById(id);
}

// Create a new member under the given manager, with optional detail fields.
async function createMember(data) {
  const hash = await argon2.hash(data.password);
  const { rows: [created] } = await pool.query(
    `INSERT INTO users
       (email, password_hash, role, manager_id, department_id, full_name,
        phone, college, course, year_of_study, position, joining_date, internship_status, location, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING id`,
    [
      data.email, hash, data.role, data.manager_id, data.department_id || null, data.full_name || null,
      data.phone || null, data.college || null, data.course || null, data.year_of_study || null,
      data.position || null, data.joining_date || null, data.internship_status || 'ACTIVE',
      data.location || null, data.notes || null,
    ]
  );
  return getMemberById(created.id);
}

async function emailExists(email) {
  const { rowCount } = await pool.query('SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  return rowCount > 0;
}

async function getUserRole(id) {
  const { rows } = await pool.query('SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
  return rows[0]?.role || null;
}

// Attendance + ratings history for the member-detail view.
async function getMemberHistory(id) {
  const [attendance, ratings] = await Promise.all([
    pool.query(
      `SELECT a.id, a.date, a.status, a.remarks, m.full_name AS marked_by_name
       FROM attendance a LEFT JOIN users m ON m.id = a.marked_by
       WHERE a.user_id = $1 AND a.deleted_at IS NULL
       ORDER BY a.date DESC LIMIT 60`,
      [id]
    ),
    pool.query(
      `SELECT r.id, r.score, r.remarks, r.created_at, rb.full_name AS rated_by_name
       FROM ratings r LEFT JOIN users rb ON rb.id = r.rated_by
       WHERE r.rated_user_id = $1 AND r.deleted_at IS NULL
       ORDER BY r.created_at DESC LIMIT 60`,
      [id]
    ),
  ]);
  return { attendance: attendance.rows, ratings: ratings.rows };
}

async function setMemberStatus(id, suspended) {
  await pool.query('UPDATE users SET suspended = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL', [suspended, id]);
  return getMemberById(id);
}

module.exports = {
  getTeamMembers, getMemberById, updateMember, EDITABLE_FIELDS,
  createMember, emailExists, getUserRole, getMemberHistory, setMemberStatus,
};
