import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReminderTimes, getNextWeeklyDigestTime } from '../src/services/reminderScheduler.js';

test('buildReminderTimes returns ten-minute and one-hour reminders', () => {
  const base = new Date('2026-07-12T10:00:00.000Z');
  const reminders = buildReminderTimes(base, () => 0);

  assert.equal(reminders.length, 2);
  assert.equal(reminders[0].label, 'ten-minutes');
  assert.equal(reminders[1].label, 'one-hour');
  assert.ok(reminders[0].at.getTime() >= base.getTime() + 10 * 60 * 1000 - 60_000);
  assert.ok(reminders[0].at.getTime() <= base.getTime() + 10 * 60 * 1000 + 60_000);
  assert.ok(reminders[1].at.getTime() >= base.getTime() + 60 * 60 * 1000 - 60_000);
  assert.ok(reminders[1].at.getTime() <= base.getTime() + 60 * 60 * 1000 + 60_000);
});

test('getNextWeeklyDigestTime returns the next Monday at 09:00', () => {
  const now = new Date('2026-07-12T10:00:00.000Z');
  const next = getNextWeeklyDigestTime(now);

  assert.equal(next.toISOString(), '2026-07-13T03:30:00.000Z');
});
