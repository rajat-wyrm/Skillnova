#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  Link existing users to Google accounts by email
//  Usage: node scripts/link-google-users.js --link
// ════════════════════════════════════════════════════════════
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function linkUsers() {
  const users = await prisma.user.findMany({
    where: { googleId: null, authProvider: 'password' },
    select: { id: true, email: true, name: true },
  });

  console.log(`Found ${users.length} password-only users.`);
  console.log('To link a Google account, update the user record directly:');
  console.log('');
  console.log('  prisma.user.update({');
  console.log('    where: { email: "user@example.com" },');
  console.log('    data:  { googleId: "<google-user-id>", authProvider: "google" }');
  console.log('  });');
  console.log('');
  console.log('After linking, the user can sign in via either method.');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--link')) {
    await linkUsers();
  } else {
    console.log('Usage: node scripts/link-google-users.js --link');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
