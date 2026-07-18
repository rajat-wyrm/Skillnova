import prisma from '../utils/prisma.js';
import { notify } from './notification.service.js';
import { logger } from '../utils/logger.js';

const getTodayDate = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getYesterdayDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export async function awardXP(userId, amount) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    let newXp = user.xp + amount;
    let newLevel = user.level;
    let leveledUp = false;

    // Level formula: Level-up threshold is currentLevel * 100
    while (newXp >= newLevel * 100) {
      newXp -= newLevel * 100;
      newLevel += 1;
      leveledUp = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel },
    });

    if (leveledUp) {
      await notify(userId, {
        type: 'system',
        title: '🎉 Leveled Up!',
        body: `Congratulations! You reached Level ${newLevel}! Keep learning!`,
        link: '/profile',
      });
      logger.info({ userId, level: newLevel }, 'gamification:level-up');
    }

    return { xp: newXp, level: newLevel, leveledUp, updatedUser };
  } catch (err) {
    logger.error({ err, userId }, 'gamification:award-xp-failed');
    return null;
  }
}

export async function logActivity(userId) {
  try {
    const today = getTodayDate();
    
    // 1. Create StreakLog for today if it doesn't exist
    const logExists = await prisma.streakLog.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (logExists) return;

    await prisma.streakLog.create({
      data: { userId, date: today },
    });

    // 2. Fetch user to check last active date and current streak
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    let currentStreak = user.streak;
    let longestStreak = user.longestStreak;
    const lastActive = user.lastActive;

    if (!lastActive) {
      // First activity
      currentStreak = 1;
    } else {
      const lastActiveDate = new Date(lastActive);
      lastActiveDate.setUTCHours(0, 0, 0, 0);

      const yesterday = getYesterdayDate();

      if (lastActiveDate.getTime() === yesterday.getTime()) {
        // Active yesterday, increment streak
        currentStreak += 1;
      } else if (lastActiveDate.getTime() === today.getTime()) {
        // Already active today, streak stays the same
      } else {
        // Gap of more than a day, reset streak to 1
        currentStreak = 1;
      }
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        streak: currentStreak,
        longestStreak: longestStreak,
        lastActive: new Date(),
      },
    });

    // 3. Check for streak-based badges
    await checkBadges(userId, 'STREAK', currentStreak);
  } catch (err) {
    logger.error({ err, userId }, 'gamification:log-activity-failed');
  }
}

export async function updateDailyGoal(userId, type, amount) {
  try {
    const today = getTodayDate();

    // Find or create daily goal for today
    let dailyGoal = await prisma.dailyGoal.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (!dailyGoal) {
      dailyGoal = await prisma.dailyGoal.create({
        data: {
          userId,
          date: today,
          tasksGoal: 1,
          reportsGoal: 0, // usually weekly, but can be set by system
          kbReadGoal: 1,
        },
      });
    }

    // Update goal fields
    const dataUpdate = {};
    if (type === 'tasks') {
      dataUpdate.tasksDone = dailyGoal.tasksDone + amount;
    } else if (type === 'reports') {
      dataUpdate.reportsDone = dailyGoal.reportsDone + amount;
    } else if (type === 'kbRead') {
      dataUpdate.kbReadDone = dailyGoal.kbReadDone + amount;
    }

    // Check completion condition
    const finalTasksDone = dataUpdate.tasksDone !== undefined ? dataUpdate.tasksDone : dailyGoal.tasksDone;
    const finalReportsDone = dataUpdate.reportsDone !== undefined ? dataUpdate.reportsDone : dailyGoal.reportsDone;
    const finalKbReadDone = dataUpdate.kbReadDone !== undefined ? dataUpdate.kbReadDone : dailyGoal.kbReadDone;

    const isCompleted =
      finalTasksDone >= dailyGoal.tasksGoal &&
      finalReportsDone >= dailyGoal.reportsGoal &&
      finalKbReadDone >= dailyGoal.kbReadGoal;

    if (isCompleted && !dailyGoal.completed) {
      dataUpdate.completed = true;
    }

    const updatedGoal = await prisma.dailyGoal.update({
      where: { id: dailyGoal.id },
      data: dataUpdate,
    });

    // Award XP bonus on first completion
    if (isCompleted && !dailyGoal.completed) {
      await awardXP(userId, 100);
      await notify(userId, {
        type: 'system',
        title: '🎯 Daily Goal Completed!',
        body: 'You met all your daily learning targets! (+100 XP)',
        link: '/profile',
      });
    }

    return updatedGoal;
  } catch (err) {
    logger.error({ err, userId, type }, 'gamification:update-daily-goal-failed');
    return null;
  }
}

export async function checkBadges(userId, requirementType, value) {
  try {
    // 1. Fetch eligible badges
    const eligibleBadges = await prisma.badge.findMany({
      where: {
        requirementType,
        requirementValue: { lte: value },
      },
    });

    if (eligibleBadges.length === 0) return;

    // 2. Fetch user's unlocked badges
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const unlockedIds = new Set(userBadges.map((ub) => ub.badgeId));

    // 3. Unlock newly eligible badges
    for (const badge of eligibleBadges) {
      if (!unlockedIds.has(badge.id)) {
        await prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        });

        // Award badge XP reward
        await awardXP(userId, badge.xpReward);

        // Send unlock notification
        await notify(userId, {
          type: 'system',
          title: `🏅 Badge Unlocked: ${badge.name}`,
          body: `${badge.description} (+${badge.xpReward} XP!)`,
          link: '/profile',
        });

        logger.info({ userId, badgeName: badge.name }, 'gamification:badge-unlocked');
      }
    }
  } catch (err) {
    logger.error({ err, userId, requirementType }, 'gamification:check-badges-failed');
  }
}

export async function getGamificationStatus(userId) {
  const today = getTodayDate();
  
  // 1. Fetch user level progress
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
      streak: true,
      longestStreak: true,
    },
  });

  if (!user) throw new Error('User not found');

  // Calculate percentage to next level
  const xpNeeded = user.level * 100;
  const progressPercent = Math.min(100, Math.round((user.xp / xpNeeded) * 100));

  // 2. Fetch or create daily goal
  let dailyGoal = await prisma.dailyGoal.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!dailyGoal) {
    dailyGoal = await prisma.dailyGoal.create({
      data: {
        userId,
        date: today,
        tasksGoal: 1,
        reportsGoal: 0,
        kbReadGoal: 1,
      },
    });
  }

  // 3. Fetch unlocked badges
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { unlockedAt: 'desc' },
  });

  // 4. Fetch activity logs for the current month (for calendar heat map)
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const activityLogs = await prisma.streakLog.findMany({
    where: {
      userId,
      date: { gte: firstDayOfMonth },
    },
    select: { date: true },
  });

  const activeDates = activityLogs.map((log) => {
    const d = new Date(log.date);
    return d.toISOString().split('T')[0]; // format YYYY-MM-DD
  });

  return {
    level: user.level,
    xp: user.xp,
    xpNeeded,
    progressPercent,
    streak: user.streak,
    longestStreak: user.longestStreak,
    dailyGoal: {
      tasksGoal: dailyGoal.tasksGoal,
      tasksDone: dailyGoal.tasksDone,
      reportsGoal: dailyGoal.reportsGoal,
      reportsDone: dailyGoal.reportsDone,
      kbReadGoal: dailyGoal.kbReadGoal,
      kbReadDone: dailyGoal.kbReadDone,
      completed: dailyGoal.completed,
    },
    badges: userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      xpReward: ub.badge.xpReward,
      unlockedAt: ub.unlockedAt,
    })),
    activeDates,
  };
}
