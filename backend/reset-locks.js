import prisma from './src/utils/prisma.js';

const result = await prisma.user.updateMany({
  data: { failedAttempts: 0, lockedUntil: null }
});
console.log('✅ Reset', result.count, 'users — all accounts unlocked!');

// Also show all users and their passwords hint
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true, role: true, status: true, failedAttempts: true, lockedUntil: true }
});
console.log('\nAll users:');
users.forEach(u => console.log(` - ${u.role} | ${u.email} | status:${u.status} | failed:${u.failedAttempts} | locked:${u.lockedUntil}`));

await prisma.$disconnect();
