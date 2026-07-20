import prisma from '../utils/prisma.js';
import lru from '../utils/lru.js';

/**
 * Get normalized UTC midnight date
 * @param {Date} date
 * @returns {Date}
 */
export function getUtcMidnight(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if the user is an intern
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isIntern(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'INTERN';
}

/**
 * Record a streak-worthy activity for a user
 * @param {string} userId
 */
export async function recordActivity(userId) {
  if (!userId) return;

  // Only track streaks for interns
  const isUserIntern = await isIntern(userId);
  if (!isUserIntern) return;

  const now = new Date();
  const today = getUtcMidnight(now);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // Fetch current streak info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActivityAt: true },
  });

  if (!user) return;

  const lastActivity = user.lastActivityAt ? getUtcMidnight(user.lastActivityAt) : null;

  let newCurrentStreak = user.currentStreak;
  let newLongestStreak = user.longestStreak;

  if (lastActivity) {
    if (lastActivity.getTime() === today.getTime()) {
      // Already recorded an activity today, do nothing
      return;
    } else if (lastActivity.getTime() === yesterday.getTime()) {
      // Continued streak!
      newCurrentStreak += 1;
      newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
    } else {
      // Broken streak, reset to 1
      newCurrentStreak = 1;
      newLongestStreak = Math.max(newLongestStreak, 1);
    }
  } else {
    // First activity ever
    newCurrentStreak = 1;
    newLongestStreak = Math.max(newLongestStreak, 1);
  }

  // Update user streak fields
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityAt: now,
    },
  });

  lru.del(`user:${userId}`);
  lru.del(`user:full:${userId}`);
}

/**
 * Resolve effective streak dynamically (so if user missed days, it shows 0)
 * @param {object} user - User object with currentStreak and lastActivityAt
 * @returns {number}
 */
export function getEffectiveStreak(user) {
  if (!user || !user.lastActivityAt) return 0;
  const today = getUtcMidnight();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastActivity = getUtcMidnight(user.lastActivityAt);

  if (lastActivity.getTime() === today.getTime() || lastActivity.getTime() === yesterday.getTime()) {
    return user.currentStreak;
  }
  return 0;
}
