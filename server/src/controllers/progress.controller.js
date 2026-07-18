import prisma from '../utils/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get progress of the currently logged-in user
 * GET /api/v1/progress
 */
export const getMyProgress = asyncHandler(async (req, res) => {

  // Logged-in user's ID comes from authentication middleware
  const userId = req.user.id;

  // 1. Get Task Information
  const [totalTasks, completedTasks] = await Promise.all([
    prisma.projectTask.count({
      where: {
        assigneeId: userId,
      },
    }),

    prisma.projectTask.count({
      where: {
        assigneeId: userId,
        status: 'DONE',
      },
    }),
  ]);

  // Calculate task progress
  const taskProgress =
    totalTasks > 0
      ? (completedTasks / totalTasks) * 100
      : 0;


  // 2. Get Report Information
  const [totalReports, reviewedReports] = await Promise.all([
    prisma.report.count({
      where: {
        userId: userId,
      },
    }),

    prisma.report.count({
      where: {
        userId: userId,
        status: 'REVIEWED',
      },
    }),
  ]);

  // Calculate report progress
  const reportProgress =
    totalReports > 0
      ? (reviewedReports / totalReports) * 100
      : 0;


  // 3. Get Attendance Information
  const totalAttendance = await prisma.attendance.count({
    where: {
      userId: userId,
    },
  });

  const presentAttendance = await prisma.attendance.count({
    where: {
      userId: userId,
      status: 'PRESENT',
    },
  });

  // Calculate attendance percentage
  const attendanceProgress =
    totalAttendance > 0
      ? (presentAttendance / totalAttendance) * 100
      : 0;


  // 4. Get Average Report Score
  const scoreResult = await prisma.report.aggregate({
    where: {
      userId: userId,
      status: 'REVIEWED',
      score: {
        not: null,
      },
    },

    _avg: {
      score: true,
    },
  });

  // Score is out of 10
  // Example: 8.5 / 10 = 85%
  const averageScore =
    scoreResult._avg.score || 0;

  const scoreProgress =
    (averageScore / 10) * 100;


  // 5. Calculate Overall Progress
  const overallProgress =
    taskProgress * 0.4 +
    reportProgress * 0.2 +
    attendanceProgress * 0.2 +
    scoreProgress * 0.2;


  // 6. Send response to frontend
  res.json({

    overallProgress:
      Math.round(overallProgress),

    tasks: {
      total: totalTasks,
      completed: completedTasks,
      percentage:
        Math.round(taskProgress),
    },

    reports: {
      total: totalReports,
      reviewed: reviewedReports,
      percentage:
        Math.round(reportProgress),
    },

    attendance: {
      total: totalAttendance,
      present: presentAttendance,
      percentage:
        Math.round(attendanceProgress),
    },

    score: {
      average:
        Number(averageScore.toFixed(1)),

      percentage:
        Math.round(scoreProgress),
    },

  });

});


export default {
  getMyProgress,
};