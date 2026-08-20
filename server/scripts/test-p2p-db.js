import prisma from '../src/utils/prisma.js';

async function test() {
  try {
    console.log('Testing prisma.directMessage...');
    if (!prisma.directMessage) {
      console.error('❌ prisma.directMessage is undefined on prisma client instance!');
    } else {
      const count = await prisma.directMessage.count();
      console.log('✅ prisma.directMessage works! Count:', count);
    }

    console.log('Testing prisma.studyGroup...');
    if (!prisma.studyGroup) {
      console.error('❌ prisma.studyGroup is undefined on prisma client instance!');
    } else {
      const groupCount = await prisma.studyGroup.count();
      console.log('✅ prisma.studyGroup works! Count:', groupCount);
    }
  } catch (err) {
    console.error('❌ Error during test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
