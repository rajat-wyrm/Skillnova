import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Helper to compute a percentage safely.
 */
function toPercentage(numerator, denominator) {
  if (!denominator || denominator === 0) return null;
  return Math.round((numerator / denominator) * 100);
}

/**
 * Get a 30‑day attendance rate (present + leave) for the given intern.
 */
async function getAttendanceScore(userId) {
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setUTCHours(0, 0, 0, 0);
  const [present, leave, total] = await Promise.all([
    prisma.attendance.count({ where: { userId, date: { gte: start }, status: 'PRESENT' } }),
    prisma.attendance.count({ where: { userId, date: { gte: start }, status: 'LEAVE' } }),
    prisma.attendance.count({ where: { userId, date: { gte: start } } }),
  ]);
  if (!total) return null;
  return Math.round(((present + leave) / total) * 100);
}

/**
 * Get task completion percentage. Prefer counters in InternProfile; fall back to aggregation.
 */
async function getTaskScore(userId) {
  const profile = await prisma.internProfile.findUnique({
    where: { userId },
    select: { totalTasks: true, completedTasks: true },
  });
  if (profile && profile.totalTasks != null && profile.completedTasks != null && profile.totalTasks > 0) {
    return Math.round((profile.completedTasks / profile.totalTasks) * 100);
  }
  // Fallback aggregation
  const [total, completed] = await Promise.all([
    prisma.projectTask.count({ where: { assigneeId: userId } }),
    prisma.projectTask.count({ where: { assigneeId: userId, status: 'DONE' } }),
  ]);
  if (!total) return null;
  return Math.round((completed / total) * 100);
}

/**
 * Get average report score for the intern. Scores are stored as Float (usually 0‑10).
 */
async function getReportScore(userId) {
  const agg = await prisma.report.aggregate({
    where: { userId, score: { not: null } },
    _avg: { score: true },
  });
  if (!agg._avg.score) return null;
  // Normalize assuming max 10; clamp to 100.
  const normalized = Math.min(100, Math.round((agg._avg.score / 10) * 100));
  return normalized;
}

/**
 * Main entry – compute overall performance status for an intern.
 */
export async function getInternPerformance(userId) {
  // Gather individual metric scores (0‑100). If any metric is missing we treat it as null.
  const [attendanceScore, taskScore, reportScore] = await Promise.all([
    getAttendanceScore(userId),
    getTaskScore(userId),
    getReportScore(userId),
  ]);

  // If all three are null, we have no data.
  if (attendanceScore === null && taskScore === null && reportScore === null) {
    return { status: 'UNKNOWN', message: 'Performance data is not available yet.' };
  }

  // Assign default weights. If a metric is missing we re‑distribute its weight proportionally.
  const weights = { attendance: 0.4, task: 0.3, report: 0.3 };
  let totalWeight = 0;
  const contributions = [];
  if (attendanceScore !== null) {
    contributions.push(attendanceScore * weights.attendance);
    totalWeight += weights.attendance;
  }
  if (taskScore !== null) {
    contributions.push(taskScore * weights.task);
    totalWeight += weights.task;
  }
  if (reportScore !== null) {
    contributions.push(reportScore * weights.report);
    totalWeight += weights.report;
  }
  const finalScore = totalWeight ? Math.round(contributions.reduce((a, b) => a + b, 0) / totalWeight) : 0;

  // Map finalScore to status/message.
  let status, message;
  let recommendation = '';
  if (finalScore >= 85) {
    status = 'GOOD';
    message = 'Good! Keep it up.';
    recommendation = 'You are doing great. Maintain your current consistency and quality of work.';
  } else if (finalScore >= 60) {
    status = 'AVERAGE';
    message = 'Your performance is average. Some improvement is needed.';
    recommendation = 'Focus on areas needing improvement to elevate your overall performance.';
  } else {
    status = 'NEEDS_IMPROVEMENT';
    message = 'Your performance needs improvement.';
    recommendation = 'Please prioritize your pending tasks and ensure regular attendance and report submissions.';
  }

  // Generate detailed insights for the frontend popup (no raw scores exposed)
  const insights = [];

  if (attendanceScore !== null) {
    if (attendanceScore >= 80) {
      insights.push({ category: 'Attendance', status: 'GOOD', message: 'Attendance is consistent. Keep it up.' });
    } else {
      insights.push({ category: 'Attendance', status: 'NEEDS_IMPROVEMENT', message: 'Attendance is below the expected level. Try maintaining regular attendance.' });
    }
  } else {
    insights.push({ category: 'Attendance', status: 'UNKNOWN', message: 'Not enough data for evaluation.' });
  }

  if (taskScore !== null) {
    if (taskScore >= 70) {
      insights.push({ category: 'Tasks', status: 'GOOD', message: 'Task completion is on track.' });
    } else {
      insights.push({ category: 'Tasks', status: 'NEEDS_IMPROVEMENT', message: 'You have pending tasks. Focus on completing assigned tasks.' });
    }
  } else {
    insights.push({ category: 'Tasks', status: 'UNKNOWN', message: 'Not enough data for evaluation.' });
  }

  if (reportScore !== null) {
    if (reportScore >= 70) {
      insights.push({ category: 'Reports', status: 'GOOD', message: 'Report quality is good.' });
    } else {
      insights.push({ category: 'Reports', status: 'NEEDS_IMPROVEMENT', message: 'Improve report submission consistency.' });
    }
  } else {
    insights.push({ category: 'Reports', status: 'UNKNOWN', message: 'Not enough data for evaluation.' });
  }

  return { status, message, insights, recommendation };
}
