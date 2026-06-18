// ════════════════════════════════════════════════════════════
//  Export Controller — CSV / JSON streaming
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function toCSV(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

function streamCSV(res, rows) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
  res.write(toCSV(rows));
  res.end();
}

// GET /exports/reports?format=csv|json
export const exportReports = asyncHandler(async (req, res) => {
  const format = (req.query.format || 'csv').toLowerCase();
  const where = req.user.role === 'INTERN' ? { userId: req.user.id } : {};
  const rows = await prisma.report.findMany({
    where,
    include: { user: { select: { name: true, email: true, department: true } } },
    orderBy: { submittedAt: 'desc' },
    take: 5000,
  });
  const data = rows.map((r) => ({
    id: r.id, intern: r.user?.name, email: r.user?.email, department: r.user?.department,
    title: r.title, week: r.weekNumber, status: r.status, score: r.score, submittedAt: r.submittedAt,
  }));
  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    return res.json({ items: data });
  }
  streamCSV(res, data);
});

// GET /exports/users?format=csv|json
export const exportUsers = asyncHandler(async (req, res) => {
  const format = (req.query.format || 'csv').toLowerCase();
  const rows = await prisma.user.findMany({
    where: { role: { in: req.user.role === 'SUPER_ADMIN' ? undefined : ['INTERN', 'MENTOR'] } },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });
  const data = rows.map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role, status: u.status,
    department: u.department, rating: u.rating, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt,
  }));
  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    return res.json({ items: data });
  }
  streamCSV(res, data);
});

// GET /exports/attendance?format=csv|json
export const exportAttendance = asyncHandler(async (req, res) => {
  const format = (req.query.format || 'csv').toLowerCase();
  const where = {};
  if (req.user.role === 'INTERN') where.userId = req.user.id;
  else if (req.query.userId) where.userId = req.query.userId;
  const rows = await prisma.attendance.findMany({
    where, orderBy: { date: 'desc' }, take: 5000,
    include: { user: { select: { name: true, email: true } } },
  });
  const data = rows.map((a) => ({
    intern: a.user?.name, email: a.user?.email, date: a.date, status: a.status,
    checkIn: a.checkIn, checkOut: a.checkOut, notes: a.notes,
  }));
  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    return res.json({ items: data });
  }
  streamCSV(res, data);
});

export default { exportReports, exportUsers, exportAttendance };
