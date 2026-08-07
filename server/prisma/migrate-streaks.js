import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Running streak and badge migration script...');

  // 1. Fetch all active interns
  const interns = await prisma.user.findMany({
    where: {
      role: 'INTERN',
    },
  });
  console.log(`Found ${interns.length} interns.`);

  // 2. Fetch all badges
  const badges = await prisma.badge.findMany();
  console.log(`Found ${badges.length} total badges.`);

  const beginnerBadge = badges.find(b => b.requirement === 3);
  if (!beginnerBadge) {
    console.error('❌ Beginner badge (requirement = 3) not found in database! Please run seed first.');
    await prisma.$disconnect();
    process.exit(1);
  }

  const defaultBadges = badges.filter(b => b.requirement !== 3);
  console.log(`Badges to unlock by default: ${defaultBadges.map(b => b.name).join(', ')}`);

  // 3. Process each intern
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  console.log(`Yesterday date reference for starting streaks: ${yesterday.toISOString()}`);

  for (const intern of interns) {
    console.log(`Processing intern: ${intern.name} (${intern.email})`);

    // Reset learning streak
    await prisma.learningStreak.upsert({
      where: { internId: intern.id },
      update: {
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: yesterday,
        streakStartedAt: null,
        lastResetDate: today,
      },
      create: {
        internId: intern.id,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: yesterday,
        streakStartedAt: null,
        lastResetDate: today,
      },
    });

    // Delete existing UserBadge relations for this intern (locks all badges)
    await prisma.userBadge.deleteMany({
      where: { internId: intern.id },
    });

    console.log(`✅ Reset streaks to 0 and locked all badges for ${intern.name}.`);
  }

  console.log('🎉 Migration completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during migration:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
