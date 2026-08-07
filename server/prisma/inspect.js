import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'INTERN' },
    include: {
      learningStreak: true,
      badges: {
        include: { badge: true }
      }
    }
  });

  console.log('--- Current Interns and their Streaks/Badges ---');
  for (const u of users) {
    console.log(`User: ${u.name} (${u.email})`);
    console.log(`  Streak: Current=${u.learningStreak?.currentStreak}, Longest=${u.learningStreak?.longestStreak}, LastCompleted=${u.learningStreak?.lastCompletedDate}`);
    console.log(`  Badges Earned: ${u.badges.map(b => b.badge.name).join(', ')}`);
  }

  const allBadges = await prisma.badge.findMany();
  console.log('--- All Badges in DB ---');
  for (const b of allBadges) {
    console.log(`Badge: ${b.name} (Requirement: ${b.requirement} days)`);
  }

  const schedulerSetting = await prisma.systemSetting.findUnique({
    where: { key: 'streak_scheduler_last_run' }
  });
  console.log('--- Scheduler Last Run ---');
  console.log(`Last run key: streak_scheduler_last_run, Value: ${schedulerSetting ? JSON.stringify(schedulerSetting.value) : 'None'}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
