// ════════════════════════════════════════════════════════════
//  Internship completion tracker — computes the five progress
//  percentages for a user from existing data (tasks, attendance,
//  learning roadmap, mentor evaluation via Report scores) and
//  upserts InternshipProgress. Also triggers badge evaluation.
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { evaluateBadgesForUser } from './badge.service.js';

async function computeTaskPct(userId) {
  const [total, done] = await Promise.all([
    prisma.projectTask.count({ where: { assigneeId: userId } }),
    prisma.projectTask.count({ where: { assigneeId: userId, status: 'DONE' } }),
  ]);
  if (total === 0) return 0;
  return Math.round((done / total) * 1000) / 10;
}

async function computeAttendancePct(userId) {
  const [total, present] = await Promise.all([
    prisma.attendance.count({ where: { userId } }),
    prisma.attendance.count({ where: { userId, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } } }),
  ]);
  if (total === 0) return 0;
  return Math.round((present / total) * 1000) / 10;
}

async function computeLearningPct(userId) {
  const assignments = await prisma.roadmapAssignment.findMany({
    where: { userId },
    include: { path: { include: { milestones: true } } },
  });
  if (assignments.length === 0) return 0;

  let totalMilestones = 0;
  let completedMilestones = 0;
  for (const a of assignments) {
    totalMilestones += a.path.milestones.length;
  }
  if (totalMilestones === 0) return 0;

  const milestoneIds = assignments.flatMap((a) => a.path.milestones.map((m) => m.id));
  completedMilestones = await prisma.milestoneProgress.count({
    where: { userId, milestoneId: { in: milestoneIds }, completed: true },
  });

  return Math.round((completedMilestones / totalMilestones) * 1000) / 10;
}

async function computeMentorEvalPct(userId) {
  // Uses reviewed Report scores (0-100 scale assumed) as a proxy for
  // mentor evaluation completion — average of scored reports.
  const reviewed = await prisma.report.findMany({
    where: { userId, status: 'REVIEWED', score: { not: null } },
    select: { score: true },
  });
  if (reviewed.length === 0) return 0;
  const avg = reviewed.reduce((sum, r) => sum + (r.score || 0), 0) / reviewed.length;
  return Math.round(avg * 10) / 10;
}

function computeFinalStatus(overallPct, hasAnyData) {
  if (!hasAnyData) return 'NOT_STARTED';
  if (overallPct >= 100) return 'COMPLETED';
  if (overallPct > 0) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

/**
 * Recompute and persist InternshipProgress for a single user.
 * Weights: tasks 35%, attendance 25%, learning 20%, mentor eval 20%.
 */
export async function recomputeProgress(userId) {
  const [taskPct, attendancePct, learningPct, mentorEvalPct] = await Promise.all([
    computeTaskPct(userId),
    computeAttendancePct(userId),
    computeLearningPct(userId),
    computeMentorEvalPct(userId),
  ]);

  const overallPct =
    Math.round((taskPct * 0.35 + attendancePct * 0.25 + learningPct * 0.2 + mentorEvalPct * 0.2) * 10) / 10;

  const hasAnyData = taskPct > 0 || attendancePct > 0 || learningPct > 0 || mentorEvalPct > 0;
  const finalStatus = computeFinalStatus(overallPct, hasAnyData);

  const progress = await prisma.internshipProgress.upsert({
    where: { userId },
    update: { taskPct, attendancePct, learningPct, mentorEvalPct, overallPct, finalStatus },
    create: { userId, taskPct, attendancePct, learningPct, mentorEvalPct, overallPct, finalStatus },
  });

  // Fire-and-forget badge evaluation; failures here shouldn't block progress updates.
  evaluateBadgesForUser(userId).catch(() => {});

  return progress;
}

export async function recomputeAll() {
  const interns = await prisma.user.findMany({ where: { role: 'INTERN' }, select: { id: true } });
  const results = [];
  for (const intern of interns) {
    results.push(await recomputeProgress(intern.id));
  }
  return results;
}

export default { recomputeProgress, recomputeAll };
