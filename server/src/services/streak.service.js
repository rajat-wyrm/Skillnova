// ════════════════════════════════════════════════════════════
//  Streak Service
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { notify } from './notification.service.js';
import { logger } from '../utils/logger.js';
import { evaluateBadgeEligibility } from './badge.service.js';

/**
 * Normalizes a date to UTC midnight.
 */
export function getUtcMidnight(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets or creates the streak record for an intern.
 */
export async function getOrCreateStreak(internId) {
  let streak = await prisma.learningStreak.findUnique({
    where: { internId }
  });
  if (!streak) {
    streak = await prisma.learningStreak.create({
      data: {
        internId,
        currentStreak: 0,
        longestStreak: 0
      }
    });
  }
  return streak;
}

/**
 * Checks if all 4 required daily activities are completed for a given calendar day.
 */
export async function checkDailyActivities(userId, date) {
  const dayStart = getUtcMidnight(date);
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  // 1. Attendance Check
  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: { userId, date: dayStart }
    }
  });
  const hasAttendance = attendance?.status === 'PRESENT';

  // 2. Report Check
  const report = await prisma.report.findFirst({
    where: {
      userId,
      submittedAt: {
        gte: dayStart,
        lt: dayEnd
      }
    }
  });
  const hasReport = !!report;

  // 3. Learning Tracker Check
  const tracker = await prisma.learningTracker.findUnique({
    where: {
      userId_date: { userId, date: dayStart }
    }
  });
  const hasTracker = !!tracker;

  // 4. Completed Daily Tasks (Automatically checked when attendance, report, and tracker are completed)
  const hasTasksCompleted = hasAttendance && hasReport && hasTracker;

  return {
    attendance: hasAttendance,
    report: hasReport,
    tasks: hasTasksCompleted,
    tracker: hasTracker,
    allCompleted: hasAttendance && hasReport && hasTasksCompleted && hasTracker
  };
}

/**
 * Checks and updates the user's streak for today.
 * Triggers in real-time when an activity is completed.
 */
export async function checkAndUpdateStreakForToday(userId) {
  try {
    const today = getUtcMidnight();
    const streak = await getOrCreateStreak(userId);

    // If already completed today, no need to update
    if (streak.lastCompletedDate && getUtcMidnight(streak.lastCompletedDate).getTime() === today.getTime()) {
      return { streak, newlyUnlocked: [] };
    }

    const { allCompleted } = await checkDailyActivities(userId, today);
    if (!allCompleted) {
      return { streak, newlyUnlocked: [] };
    }

    // All completed! Update streak
    const newCurrent = streak.currentStreak + 1;
    const newLongest = Math.max(streak.longestStreak, newCurrent);

    const updated = await prisma.learningStreak.update({
      where: { internId: userId },
      data: {
        currentStreak: newCurrent,
        longestStreak: newLongest,
        lastCompletedDate: today,
        streakStartedAt: streak.streakStartedAt || today
      }
    });

    logger.info(`🔥 Intern ${userId} streak increased to ${newCurrent} days!`);

    // Send notification
    await notify(userId, {
      type: 'streak',
      title: '🎉 Great job!',
      body: `Your learning streak is now ${newCurrent} days.\nKeep it going!`,
      link: '/dashboard'
    });

    // Evaluate badges
    const newlyUnlocked = await evaluateBadgeEligibility(userId);

    return { streak: updated, newlyUnlocked };
  } catch (err) {
    logger.error({ err, userId }, 'failed-to-update-streak');
    throw err;
  }
}

/**
 * Scheduler function running once daily after midnight.
 * Validates the previous day (yesterday) and resets if missed.
 */
export async function runDailyStreakScheduler() {
  const today = getUtcMidnight();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  logger.info(`🕒 Starting Daily Streak Scheduler for yesterday: ${yesterday.toISOString().split('T')[0]}`);

  // Fetch all active interns
  const interns = await prisma.user.findMany({
    where: {
      role: 'INTERN',
      status: 'ACTIVE'
    },
    select: { id: true, name: true }
  });

  for (const intern of interns) {
    try {
      const streak = await getOrCreateStreak(intern.id);
      const lastCompleted = streak.lastCompletedDate ? getUtcMidnight(streak.lastCompletedDate) : null;

      // If yesterday was already marked completed, skip
      if (lastCompleted && lastCompleted.getTime() === yesterday.getTime()) {
        continue;
      }

      // Check if yesterday was completed
      const { allCompleted } = await checkDailyActivities(intern.id, yesterday);

      if (allCompleted) {
        // Credit yesterday (if they haven't been credited yet)
        if (!lastCompleted || lastCompleted.getTime() < yesterday.getTime()) {
          const newCurrent = streak.currentStreak + 1;
          const newLongest = Math.max(streak.longestStreak, newCurrent);

          await prisma.learningStreak.update({
            where: { internId: intern.id },
            data: {
              currentStreak: newCurrent,
              longestStreak: newLongest,
              lastCompletedDate: yesterday,
              streakStartedAt: streak.streakStartedAt || yesterday
            }
          });

          await notify(intern.id, {
            type: 'streak',
            title: '🎉 Great job!',
            body: `Your learning streak is now ${newCurrent} days.\nKeep it going!`,
            link: '/dashboard'
          });

          // Evaluate badges
          await evaluateBadgeEligibility(intern.id);

          logger.info(`🔥 Intern ${intern.name} (${intern.id}) yesterday credited. Streak is ${newCurrent} days.`);
        }
      } else {
        // Yesterday was missed!
        // Reset streak if currentStreak > 0
        if (streak.currentStreak > 0) {
          await prisma.learningStreak.update({
            where: { internId: intern.id },
            data: {
              currentStreak: 0,
              lastResetDate: today
            }
          });

          await notify(intern.id, {
            type: 'streak',
            title: 'Streak Lost',
            body: 'Your learning streak has been reset because yesterday\'s required activities were not completed.\n\nStart again today!',
            link: '/dashboard'
          });

          logger.info(`💔 Intern ${intern.name} (${intern.id}) missed yesterday. Streak reset.`);
        }
      }
    } catch (err) {
      logger.error({ err, userId: intern.id }, `failed-to-process-scheduler-for-intern`);
    }
  }
}
