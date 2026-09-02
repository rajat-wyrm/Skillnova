import cron from 'node-cron';
import prisma from './prisma.js';
import { logger } from './logger.js';

export function startCronJobs() {
  // Run at 23:55 every day
  cron.schedule('55 23 * * *', async () => {
    logger.info('Running daily automated attendance resolution');
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Sum duration per user
      const sessions = await prisma.userSession.groupBy({
        by: ['userId'],
        where: { date: today },
        _sum: { durationSeconds: true }
      });

      for (const session of sessions) {
        const duration = session._sum.durationSeconds || 0;
        const status = duration >= 7200 ? 'PRESENT' : 'ABSENT';

        // Check if an override like LEAVE exists
        const existing = await prisma.attendance.findUnique({
          where: { userId_date: { userId: session.userId, date: today } }
        });

        if (!existing || (existing.status !== 'LEAVE' && existing.status !== 'HALF_DAY')) {
            await prisma.attendance.upsert({
              where: { userId_date: { userId: session.userId, date: today } },
              update: { status, notes: `Automated resolution: ${Math.floor(duration/60)} mins active` },
              create: {
                userId: session.userId,
                date: today,
                status,
                notes: `Automated resolution: ${Math.floor(duration/60)} mins active`
              }
            });
        }
      }

      // Mark unlogged users as ABSENT on weekdays
      const dayOfWeek = today.getUTCDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Mon-Fri
        const activeUserIds = sessions.map(s => s.userId);
        
        const interns = await prisma.user.findMany({
          where: { role: 'INTERN', status: 'ACTIVE' },
          select: { id: true }
        });

        const missingUserIds = interns.map(u => u.id).filter(id => !activeUserIds.includes(id));
        
        for (const userId of missingUserIds) {
          const existing = await prisma.attendance.findUnique({
            where: { userId_date: { userId, date: today } }
          });
          
          if (!existing) {
             await prisma.attendance.create({
                data: {
                  userId,
                  date: today,
                  status: 'ABSENT',
                  notes: 'Automated resolution: No logins'
                }
             });
          }
        }
      }

      logger.info('Completed daily attendance resolution');
    } catch (e) {
      logger.error({ err: e }, 'cron:attendance-resolution-failed');
    }
  });
}
