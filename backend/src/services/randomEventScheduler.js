// ════════════════════════════════════════════════════════════
//  Random Event Scheduler — Auto-announces college events
//  Pushes notifications to ALL active users automatically
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { notifyMany, broadcast } from './notification.service.js';
import { logger } from '../utils/logger.js';

// ── Random event pool ──────────────────────────────────────
const RANDOM_EVENTS = [
  {
    title: '🎓 Guest Lecture: AI & Future of Tech',
    body: 'Join us for an insightful guest lecture by industry experts on Artificial Intelligence and the Future of Technology. Register now to secure your seat!',
    priority: 'HIGH',
    pinned: true,
  },
  {
    title: '🏆 Hackathon Registration Open',
    body: '24-hour coding Hackathon is now open for registration! Form teams of 2-4, pick a problem statement, and showcase your skills. Winners get internship PPOs!',
    priority: 'HIGH',
    pinned: true,
  },
  {
    title: '📋 Weekly Report Submission Reminder',
    body: 'Friendly reminder: Submit your weekly internship reports by Friday 5:00 PM. Late submissions may affect your performance score.',
    priority: 'MEDIUM',
    pinned: false,
  },
  {
    title: '🎤 Tech Talk: Cloud Architecture Best Practices',
    body: 'Our senior engineers will walk through Cloud Architecture, DevOps pipelines, and microservices patterns. Attendance is mandatory for all interns.',
    priority: 'MEDIUM',
    pinned: false,
  },
  {
    title: '🌟 Intern of the Month — Nominations Open',
    body: 'Nominate your fellow intern for the "Intern of the Month" award! Criteria: Punctuality, Quality of Work, Teamwork. Submit nominations via the portal.',
    priority: 'MEDIUM',
    pinned: false,
  },
  {
    title: '🚀 New Project Kickoff: SkillNova v3',
    body: 'We are kicking off SkillNova v3 development! All interns from Web Dev & Mobile teams must attend the kickoff meeting tomorrow at 10 AM in Room 204.',
    priority: 'HIGH',
    pinned: true,
  },
  {
    title: '📚 Library Resources Updated',
    body: 'Our online library has been updated with 200+ new eBooks on React, Node.js, System Design, and Data Structures. Access them via the Knowledge Base section.',
    priority: 'LOW',
    pinned: false,
  },
  {
    title: '💻 System Maintenance Scheduled',
    body: 'Scheduled maintenance on Sunday 2:00 AM - 4:00 AM IST. The portal may be temporarily unavailable. Please complete your work before the downtime window.',
    priority: 'MEDIUM',
    pinned: false,
  },
  {
    title: '🎯 Mid-Term Performance Reviews Starting',
    body: 'Mid-term performance reviews begin next week. Your mentor will schedule a 1:1 session. Please prepare a summary of your contributions and challenges faced.',
    priority: 'HIGH',
    pinned: false,
  },
  {
    title: '🏅 Certification Exam Dates Announced',
    body: 'AWS, Google Cloud, and Azure certification exam slots are now available. Apply through the training portal before the 30th to get the company-sponsored voucher.',
    priority: 'MEDIUM',
    pinned: false,
  },
  {
    title: '🎊 Team Outing — Register by EOD',
    body: 'Celebrate Q2 milestones with a team outing at EcoWorld! Date: This Saturday. Lunch and transport provided. Register via HR portal before today end of day.',
    priority: 'HIGH',
    pinned: true,
  },
  {
    title: '🔐 Mandatory Security Training',
    body: 'Cybersecurity awareness training is now mandatory for all interns. Complete the 45-minute online module by end of this week to remain compliant.',
    priority: 'HIGH',
    pinned: false,
  },
  {
    title: '📊 Q2 Analytics & Insights Session',
    body: 'Join the Q2 analytics review session where leadership shares platform growth metrics, user engagement stats, and upcoming product roadmap.',
    priority: 'MEDIUM',
    pinned: false,
  },
  {
    title: '🌐 Open Source Contribution Drive',
    body: 'SkillNova is contributing to open source! Pick an issue from our GitHub board and submit a PR. Merged PRs count as bonus tasks and will be mentioned in your review.',
    priority: 'MEDIUM',
    pinned: false,
  },
  {
    title: '🎓 Graduation Ceremony — Batch 2025 Completion',
    body: 'Congratulations to all completing interns! The graduation ceremony is scheduled for next Friday at 3 PM. Formal dress code. Parents and families are welcome.',
    priority: 'HIGH',
    pinned: true,
  },
];

let eventIndex = Math.floor(Math.random() * RANDOM_EVENTS.length);

function getNextEvent() {
  const event = RANDOM_EVENTS[eventIndex % RANDOM_EVENTS.length];
  eventIndex = (eventIndex + 1) % RANDOM_EVENTS.length;
  return event;
}

async function getOrCreateSystemUser() {
  // Try to find an admin/super_admin to post as
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, status: 'ACTIVE' },
    select: { id: true },
  });
  if (admin) return admin.id;

  // Fallback: first user
  const user = await prisma.user.findFirst({ select: { id: true } });
  return user?.id ?? null;
}

async function publishRandomEvent() {
  try {
    const authorId = await getOrCreateSystemUser();
    if (!authorId) {
      logger.warn('[RandomEventScheduler] No users found — skipping event publish');
      return;
    }

    const eventData = getNextEvent();

    // Create announcement in DB
    const announcement = await prisma.announcement.create({
      data: {
        ...eventData,
        authorId,
      },
    });

    logger.info(`[RandomEventScheduler] 📢 Published: "${announcement.title}"`);

    // Notify ALL active users via DB + Socket.io
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    if (users.length > 0) {
      await notifyMany(
        users.map((u) => u.id),
        {
          type: 'announcement',
          title: announcement.title,
          body: announcement.body.slice(0, 200),
          link: `/announcements/${announcement.id}`,
        }
      );
    }

    // Broadcast to all connected sockets (even unauthenticated previews)
    broadcast({
      type: 'announcement',
      title: announcement.title,
      body: announcement.body.slice(0, 150),
      announcementId: announcement.id,
      priority: announcement.priority,
      timestamp: new Date().toISOString(),
    });

    logger.info(`[RandomEventScheduler] ✅ Notified ${users.length} users`);
  } catch (err) {
    logger.error({ err }, '[RandomEventScheduler] Failed to publish event');
  }
}

/**
 * Start the random event scheduler.
 * @param {number} intervalMs - How often to push events (default: 2 minutes for demo)
 */
export function startRandomEventScheduler(intervalMs = 2 * 60 * 1000) {
  logger.info(`[RandomEventScheduler] 🎲 Started — publishing every ${intervalMs / 1000}s`);

  // Push first event after 15 seconds (give server time to boot)
  setTimeout(() => {
    publishRandomEvent();
    // Then push on interval
    setInterval(publishRandomEvent, intervalMs);
  }, 15_000);
}

export default { startRandomEventScheduler };
