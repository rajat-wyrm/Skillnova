import prisma from '../src/utils/prisma.js';

async function testSendMessage() {
  try {
    const users = await prisma.user.findMany({ take: 2, select: { id: true, name: true, email: true } });
    if (users.length < 2) {
      console.log('Need at least 2 users to test DM. Users found:', users.length);
      return;
    }

    const [userA, userB] = users;
    console.log(`Testing DM from "${userA.name}" (${userA.id}) to "${userB.name}" (${userB.id})...`);

    // 1. Create direct message
    const msg = await prisma.directMessage.create({
      data: {
        senderId: userA.id,
        recipientId: userB.id,
        content: 'Hello from test suite! How is the project going?',
      },
      include: {
        sender: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
      },
    });
    console.log('✅ Created test message in DB:', msg.id, msg.content);

    // 2. Query conversation from userB's perspective
    const userBMessages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userB.id, recipientId: userA.id },
          { senderId: userA.id, recipientId: userB.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✅ User B sees ${userBMessages.length} messages in conversation with User A!`);

    // 3. User B replies
    const reply = await prisma.directMessage.create({
      data: {
        senderId: userB.id,
        recipientId: userA.id,
        content: 'Hey! The project is going great, working on the new features.',
      },
    });
    console.log('✅ User B replied with message:', reply.id, reply.content);

    // 4. Query total messages
    const totalConvs = await prisma.directMessage.count({
      where: {
        OR: [
          { senderId: userA.id },
          { recipientId: userA.id },
        ],
      },
    });
    console.log('✅ Total messages involving User A:', totalConvs);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testSendMessage();
