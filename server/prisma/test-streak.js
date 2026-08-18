import { PrismaClient } from '@prisma/client';
import { checkDailyActivities, checkAndUpdateStreakForToday, getUtcMidnight } from '../src/services/streak.service.js';

const prisma = new PrismaClient();

async function runTest() {
  console.log('🧪 Starting Streak checklist logic automated test...');

  const intern = await prisma.user.findFirst({
    where: { email: 'rahul@skillnova.com' }
  });

  if (!intern) {
    console.error('❌ Intern Rahul Sharma not found. Run seed first.');
    process.exit(1);
  }

  const today = getUtcMidnight();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dayEnd = new Date(today.getTime() + 86400000);

  console.log(`Test Context: Intern ID = ${intern.id}, Today = ${today.toISOString()}, Yesterday = ${yesterday.toISOString()}`);

  // 1. Reset today's activities and streak for clean test state
  await prisma.attendance.deleteMany({
    where: { userId: intern.id, date: today }
  });
  await prisma.report.deleteMany({
    where: { userId: intern.id, submittedAt: { gte: today, lt: dayEnd } }
  });
  await prisma.learningTracker.deleteMany({
    where: { userId: intern.id, date: today }
  });

  await prisma.learningStreak.upsert({
    where: { internId: intern.id },
    update: {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: yesterday,
      streakStartedAt: null,
    },
    create: {
      internId: intern.id,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: yesterday,
      streakStartedAt: null,
    }
  });

  console.log('🧹 Cleaned up today\'s records and reset streak to 0.');

  // 2. Initial state check (all should be false)
  let status = await checkDailyActivities(intern.id, today);
  console.log('Initial Status:', status);
  if (status.attendance || status.report || status.tracker || status.tasks || status.allCompleted) {
    throw new Error('❌ Initial status should be all false!');
  }
  console.log('✅ Initial status test passed.');

  // 3. Mark Attendance
  await prisma.attendance.create({
    data: {
      userId: intern.id,
      date: today,
      status: 'PRESENT',
      checkIn: new Date(),
    }
  });
  status = await checkDailyActivities(intern.id, today);
  console.log('After Attendance:', status);
  if (!status.attendance || status.report || status.tracker || status.tasks || status.allCompleted) {
    throw new Error('❌ Only attendance should be true!');
  }
  console.log('✅ Attendance status test passed.');

  // 4. Submit Report
  await prisma.report.create({
    data: {
      userId: intern.id,
      title: 'Test Daily Report',
      content: 'I worked on testing streak check automation today.',
      weekNumber: 4,
      status: 'PENDING'
    }
  });
  status = await checkDailyActivities(intern.id, today);
  console.log('After Report:', status);
  if (!status.attendance || !status.report || status.tracker || status.tasks || status.allCompleted) {
    throw new Error('❌ Attendance and Report should be true, others false!');
  }
  console.log('✅ Report status test passed.');

  // 5. Submit Learning Tracker (This should auto-tick Tasks and complete all!)
  await prisma.learningTracker.create({
    data: {
      userId: intern.id,
      date: today,
      content: 'Learned how to dynamically compute task completion based on sub-tasks.'
    }
  });
  status = await checkDailyActivities(intern.id, today);
  console.log('After Learning Tracker (Final state):', status);
  if (!status.attendance || !status.report || !status.tracker || !status.tasks || !status.allCompleted) {
    throw new Error('❌ All tasks and allCompleted should be true!');
  }
  console.log('✅ Automatic tasks checking and completion checklist test passed!');

  // 6. Update Streak and check that currentStreak is incremented to 1
  const updateResult = await checkAndUpdateStreakForToday(intern.id);
  console.log('Streak Update Result:', updateResult.streak);
  if (updateResult.streak.currentStreak !== 1) {
    throw new Error(`❌ Streak should be 1 but got ${updateResult.streak.currentStreak}`);
  }
  console.log('✅ Real-time streak increment to 1 test passed!');

  console.log('🎉 All automated tests completed successfully!');
}

runTest()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
