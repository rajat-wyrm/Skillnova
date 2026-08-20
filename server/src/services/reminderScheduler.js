import prisma from '../utils/prisma.js';
import { notifyMany } from './notification.service.js';

const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const WEEKLY_DIGEST_HOUR = 9;
const WEEKLY_DIGEST_MINUTE = 0;

export function buildReminderTimes(baseTime, rng = Math.random) {
  const base = new Date(baseTime);
  const actualRng = typeof rng === 'function' ? rng : () => 0.5;
  const tenMinutes = new Date(base.getTime() + TEN_MINUTES_MS);
  const oneHour = new Date(base.getTime() + ONE_HOUR_MS);
  const jitteredTenMinutes = new Date(tenMinutes.getTime() + Math.round((actualRng() - 0.5) * 2 * 60_000));
  const jitteredOneHour = new Date(oneHour.getTime() + Math.round((actualRng() - 0.5) * 2 * 60_000));

  return [
    { label: 'ten-minutes', at: jitteredTenMinutes },
    { label: 'one-hour', at: jitteredOneHour },
  ];
}

export function getNextWeeklyDigestTime(now = new Date()) {
  const base = new Date(now);
  const day = base.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  const nextMonday = new Date(base);
  nextMonday.setDate(base.getDate() + daysUntilMonday);
  nextMonday.setHours(WEEKLY_DIGEST_HOUR, WEEKLY_DIGEST_MINUTE, 0, 0);
  return nextMonday;
}

function isSameMinute(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() && a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes();
}

async function sendEventReminder(event, label, userIds) {
  if (!userIds.length) return;
  const title = label === 'ten-minutes' ? 'Event reminder' : 'Upcoming event';
  const body = `${event.title} starts ${new Date(event.startsAt).toLocaleString()}${event.location ? ` at ${event.location}` : ''}`;
  await notifyMany(userIds, {
    type: 'event',
    title,
    body,
    link: '/calendar',
  });
}

export async function processReminderQueue() {
  const now = new Date();

  const upcomingMeetings = await prisma.meeting.findMany({
    where: {
      startsAt: { gte: now },
    },
    select: { id: true, title: true, startsAt: true, location: true, organizerId: true, attendees: { select: { userId: true } } },
  });

  for (const meeting of upcomingMeetings) {
    const userIds = [meeting.organizerId, ...meeting.attendees.map((a) => a.userId)].filter(Boolean);
    const reminderTimes = buildReminderTimes(meeting.startsAt);
    for (const reminder of reminderTimes) {
      if (isSameMinute(now, reminder.at)) {
        await sendEventReminder(meeting, reminder.label, userIds);
      }
    }
  }

  const weeklyAnnouncements = await prisma.announcement.findMany({
    where: { pinned: true },
    select: { id: true, title: true, body: true },
  });

  if (isSameMinute(now, getNextWeeklyDigestTime(now))) {
    const users = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
    await notifyMany(
      users.map((u) => u.id),
      {
        type: 'announcement',
        title: 'Weekly announcements digest',
        body: weeklyAnnouncements.length
          ? weeklyAnnouncements.map((item) => `${item.title}: ${item.body.slice(0, 140)}`).join(' • ')
          : 'No new announcements this week.',
        link: '/announcements',
      }
    );
  }
}

export function startReminderScheduler() {
  const tick = async () => {
    try {
      await processReminderQueue();
    } catch (error) {
      console.error('Reminder scheduler failed', error);
    } finally {
      setTimeout(tick, 60_000);
    }
  };

  tick();
}
