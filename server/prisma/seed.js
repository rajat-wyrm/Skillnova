// ════════════════════════════════════════════════════════════
//  SkillNova — DB seed script
//  Creates Super Admin, Admin, Mentor, Interns + sample data
// ════════════════════════════════════════════════════════════
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hash = (s) => bcrypt.hashSync(s, 12);

async function main() {
  console.log('🌱  Seeding SkillNova database…');

  // ── Categories ─────────────────────────────────────────
  const categories = await Promise.all(
    [
      { name: 'Onboarding',  order: 1, icon: '🚀' },
      { name: 'Reports',     order: 2, icon: '📄' },
      { name: 'Technical',   order: 3, icon: '💻' },
      { name: 'Templates',   order: 4, icon: '📋' },
      { name: 'Meetings',    order: 5, icon: '📅' },
      { name: 'Code Review', order: 6, icon: '🔍' },
    ].map((c) =>
      prisma.knowledgeCategory.upsert({
        where: { slug: c.name.toLowerCase().replace(/\s+/g, '-') },
        update: {},
        create: {
          name: c.name,
          slug: c.name.toLowerCase().replace(/\s+/g, '-'),
          icon: c.icon,
          order: c.order,
          description: `${c.name} related articles for SkillNova interns.`,
        },
      })
    )
  );

  // ── Users ──────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@skillnova.com' },
    update: {},
    create: {
      email: 'superadmin@skillnova.com',
      passwordHash: hash('SuperAdmin#2026'),
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'Platform',
      skills: 'Platform Architecture, Security, Compliance',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@skillnova.com' },
    update: {},
    create: {
      email: 'admin@skillnova.com',
      passwordHash: hash('Admin#2026'),
      name: 'Priya Patel',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'Operations',
      skills: 'Operations, Hiring, People Management',
      rating: 9.1,
    },
  });

  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@skillnova.com' },
    update: {},
    create: {
      email: 'mentor@skillnova.com',
      passwordHash: hash('Mentor#2026'),
      name: 'Amit Verma',
      role: 'MENTOR',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'Engineering',
      skills: 'Node.js, React, PostgreSQL, System Design',
      rating: 8.7,
      mentorProfile: {
        create: {
          bio: 'Senior engineer with 8+ years experience in full-stack development.',
          expertise: 'Node.js, React, Postgres, AWS',
          maxInterns: 8,
        },
      },
    },
  });

  const internData = [
    { email: 'rahul@skillnova.com', name: 'Rahul Sharma',  dept: 'AI/ML',        skills: 'Python, TensorFlow, Data Analysis',         rating: 8.5, currentStreak: 12, longestStreak: 15, lastActivityAt: new Date() },
    { email: 'sneha@skillnova.com', name: 'Sneha Reddy',   dept: 'Backend',      skills: 'Node.js, PostgreSQL, Redis, Docker',         rating: 8.8, currentStreak: 8,  longestStreak: 10, lastActivityAt: new Date() },
    { email: 'kavya@skillnova.com',  name: 'Kavya Sree',    dept: 'Frontend',     skills: 'React, Tailwind, TypeScript',               rating: 9.0, currentStreak: 15, longestStreak: 20, lastActivityAt: new Date() },
    { email: 'arjun@skillnova.com',  name: 'Arjun Mehta',   dept: 'Data Science', skills: 'Pandas, scikit-learn, SQL, Tableau',         rating: 8.2, currentStreak: 0,  longestStreak: 5,  lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { email: 'user@skillnova.com',   name: 'Demo Intern',   dept: 'Web Dev',      skills: 'JavaScript, React, Node.js',                rating: 7.8, currentStreak: 3,  longestStreak: 4,  lastActivityAt: new Date() },
  ];

  const interns = [];
  for (const i of internData) {
    const user = await prisma.user.upsert({
      where: { email: i.email },
      update: {
        currentStreak: i.currentStreak,
        longestStreak: i.longestStreak,
        lastActivityAt: i.lastActivityAt,
      },
      create: {
        email: i.email,
        passwordHash: hash('User#2026'),
        name: i.name,
        role: 'INTERN',
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        department: i.dept,
        skills: i.skills,
        college: 'ABC Engineering College',
        yearOfStudy: 'Final Year',
        dateOfBirth: new Date('2003-05-12'),
        linkedinUrl: `https://linkedin.com/in/${i.email.split('@')[0]}`,
        rating: i.rating,
        currentStreak: i.currentStreak,
        longestStreak: i.longestStreak,
        lastActivityAt: i.lastActivityAt,
        internProfile: {
          create: {
            startDate: new Date('2026-01-15'),
            mentorId: mentor.id,
            totalTasks: 12,
            completedTasks: 8,
          },
        },
      },
    });
    interns.push(user);
  }

  // ── Teams ──────────────────────────────────────────────
  console.log('👥  Seeding Teams…');
  
  // Clean up any old invalid team IDs
  await prisma.team.deleteMany({
    where: {
      id: { in: ['seed-team-alpha', 'seed-team-beta'] },
    },
  });

  const teamAlpha = await prisma.team.upsert({
    where: { id: 'cseedteamalpha000000000001' },
    update: {
      members: {
        set: [
          { id: admin.id },
          { id: mentor.id },
          { id: interns[0].id }, // rahul
          { id: interns[1].id }, // sneha
          { id: interns[4].id }, // demo intern (user)
        ],
      },
    },
    create: {
      id: 'cseedteamalpha000000000001',
      name: 'Alpha Developers',
      description: 'The core full-stack engineering team responsible for main platform features.',
      members: {
        connect: [
          { id: admin.id },
          { id: mentor.id },
          { id: interns[0].id },
          { id: interns[1].id },
          { id: interns[4].id },
        ],
      },
    },
  });

  const teamBeta = await prisma.team.upsert({
    where: { id: 'cseedteambeta000000000002' },
    update: {
      members: {
        set: [
          { id: mentor.id },
          { id: interns[2].id }, // kavya
          { id: interns[3].id }, // arjun
          { id: interns[4].id }, // demo intern (user)
        ],
      },
    },
    create: {
      id: 'cseedteambeta000000000002',
      name: 'Beta Testers & Analysts',
      description: 'Quality assurance, platform testing, data analysis and user metrics tracking.',
      members: {
        connect: [
          { id: mentor.id },
          { id: interns[2].id },
          { id: interns[3].id },
          { id: interns[4].id },
        ],
      },
    },
  });

  // ── KB Articles ────────────────────────────────────────
  const articles = [
    {
      title: 'Getting Started with SkillNova',
      excerpt: 'A complete orientation guide for new interns joining the SkillNova platform.',
      content: `# Getting Started with SkillNova\n\nWelcome to UptoSkills! This guide walks you through your first week.\n\n## Day 1\n- Set up your SkillNova account\n- Meet your mentor in a 1:1\n- Read the company code of conduct\n\n## Day 2-3\n- Complete the onboarding modules\n- Submit your first weekly report draft\n- Browse the Knowledge Base\n\n## Day 4-5\n- Pick up your first task\n- Submit a code review request\n- Attend the team standup\n\n## Tips\n- Mark attendance daily\n- Don't skip weekly reports\n- Use the AI Assistant for quick answers`,
      category: 'Onboarding',
      tags: ['guide', 'onboarding', 'setup'],
      verified: true,
    },
    {
      title: 'How to Submit Weekly Reports',
      excerpt: 'Best practices for writing effective weekly progress reports that get approved quickly.',
      content: `# How to Submit Weekly Reports\n\nReports are due every Friday 6:00 PM IST.\n\n## Structure\n1. Goals for the week\n2. What was completed\n3. Blockers\n4. Plan for next week\n5. Learnings\n\n## Tips\n- Be specific — quantify your work\n- Include screenshots or Loom links\n- List blockers early`,
      category: 'Reports',
      tags: ['reports', 'weekly'],
      verified: true,
    },
    {
      title: 'Machine Learning Best Practices',
      excerpt: 'Production-ready ML workflow: data, training, evaluation, deployment.',
      content: `# Machine Learning Best Practices\n\n## Data\n- Version your datasets (DVC, LakeFS)\n- Always split before EDA\n\n## Training\n- Track experiments (MLflow, W&B)\n- Use cross-validation\n\n## Evaluation\n- Look beyond accuracy\n- Check for data leakage\n\n## Deployment\n- Containerise with Docker\n- Monitor for drift`,
      category: 'Technical',
      tags: ['ml', 'ai'],
      verified: false,
    },
    {
      title: 'Project Documentation Template',
      excerpt: 'Use this template to document your intern project end-to-end.',
      content: `# Project Documentation Template\n\n## Overview\nOne paragraph problem statement.\n\n## Goals\n- Goal 1\n- Goal 2\n\n## Tech Stack\n- Frontend: React\n- Backend: Node.js + Express\n- DB: PostgreSQL\n\n## Architecture\nDiagram + description.\n\n## Setup\n\`\`\`bash\ngit clone …\nnpm install\nnpm run dev\n\`\`\``,
      category: 'Templates',
      tags: ['template', 'docs'],
      verified: true,
    },
    {
      title: 'Meeting Scheduling Process',
      excerpt: 'How to schedule mentor meetings and team syncs in SkillNova.',
      content: `# Meeting Scheduling Process\n\n1. Open Meetings → Schedule\n2. Pick a slot (mentor gets notified)\n3. Add agenda items\n4. Capture notes in the meeting\n\nFor ad-hoc syncs, ping your mentor on Slack first.`,
      category: 'Meetings',
      tags: ['meetings', 'calendar'],
      verified: false,
    },
    {
      title: 'Code Review Guidelines',
      excerpt: 'What we look for when reviewing PRs at UptoSkills.',
      content: `# Code Review Guidelines\n\n## What we check\n- Correctness\n- Tests\n- Readability\n- Security\n- Performance\n\n## PR template\n\`\`\`\n## What does this PR do?\n## How was it tested?\n## Screenshots / Loom\n\`\`\`\n\nA PR is approved when 2 reviewers + CI pass.`,
      category: 'Code Review',
      tags: ['code', 'review'],
      verified: true,
    },
    {
      title: 'AI Assistant — How to use it',
      excerpt: 'Quick tour of the SkillNova AI Assistant powered by Groq + the UptoSkills KB.',
      content: `# AI Assistant\n\nThe AI Assistant is grounded on the UptoSkills knowledge base plus your live SkillNova data (reports, articles, announcements).\n\nTry asking:\n- How do I submit a weekly report?\n- Summarise my recent reports\n- Draft a meeting agenda for our standup\n- What's the attendance policy?`,
      category: 'Onboarding',
      tags: ['ai', 'assistant'],
      verified: true,
    },
  ];

  for (const a of articles) {
    const cat = categories.find((c) => c.name === a.category);
    const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await prisma.knowledgeArticle.upsert({
      where: { slug },
      update: {},
      create: {
        title: a.title,
        slug,
        content: a.content,
        excerpt: a.excerpt,
        categoryId: cat.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        verified: a.verified,
        verifiedById: a.verified ? superAdmin.id : null,
        verifiedAt: a.verified ? new Date() : null,
        tags: a.tags,
        publishedAt: new Date(),
        views: Math.floor(Math.random() * 200) + 50,
        helpful: Math.floor(Math.random() * 40) + 5,
      },
    });
  }

  // ── Announcements ──────────────────────────────────────
  await prisma.announcement.deleteMany({});
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Welcome to SkillNova 2.0!',
        body: 'We are excited to launch the new intern management platform with realtime notifications and AI-powered knowledge search. Explore the updated Knowledge Base and try the AI Assistant today!',
        priority: 'HIGH',
        pinned: true,
        authorId: superAdmin.id,
        publishedAt: new Date(),
      },
      {
        title: 'Weekly Internship Meeting',
        body: 'All interns must attend the weekly project meeting every Monday at 10:00 AM IST. Mark your attendance in the Meetings module.',
        priority: 'HIGH',
        pinned: true,
        authorId: admin.id,
        publishedAt: new Date(),
      },
      {
        title: 'Weekly Report Submission Deadline',
        body: 'Please submit your internship weekly progress report before Friday 6:00 PM IST. Use the structured template for consistency.',
        priority: 'MEDIUM',
        pinned: false,
        authorId: admin.id,
        publishedAt: new Date(),
      },
      {
        title: 'New Knowledge Base Articles Added',
        body: 'We have published 7 new articles across Onboarding, Reports, and Code Review. Check them out in the Knowledge Base.',
        priority: 'LOW',
        pinned: false,
        authorId: admin.id,
        publishedAt: new Date(),
      },
      {
        title: 'Platform Maintenance Scheduled',
        body: 'System maintenance this Sunday 2-4 AM IST. Platform will be briefly unavailable. We apologise for the inconvenience.',
        priority: 'MEDIUM',
        pinned: false,
        authorId: admin.id,
        publishedAt: new Date(),
      },
    ],
  });

  // ── Sample Reports ─────────────────────────────────────
  await prisma.report.deleteMany({ where: { userId: { in: interns.map((i) => i.id) } } });
  for (const intern of interns) {
    for (let w = 1; w <= 3; w++) {
      await prisma.report.create({
        data: {
          userId: intern.id,
          title: `Week ${w} Progress Report`,
          content: `# Week ${w}\n\n- Shipped features X, Y, Z\n- Reviewed 2 PRs\n- 1:1 with mentor\n\n## Blockers\nNone.\n\n## Next week\n- Continue feature work\n- Write tests for new modules`,
          weekNumber: w,
          status: w < 3 ? 'REVIEWED' : 'PENDING',
          score: w < 3 ? 7 + Math.random() * 3 : null,
          submittedAt: new Date(Date.now() - (3 - w) * 7 * 86400000),
          reviewedAt: w < 3 ? new Date(Date.now() - (3 - w) * 7 * 86400000 + 86400000) : null,
          reviewedById: w < 3 ? mentor.id : null,
        },
      });
    }
  }

  // ── Projects & Tasks ───────────────────────────────────
  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'SkillNova Platform',
      description: 'Internal intern management platform with realtime features and AI assistant.',
      status: 'ACTIVE',
      startDate: new Date('2026-01-15'),
      createdById: admin.id,
    },
  });

  const tasksData = [
    { title: 'Set up Postgres schema',           status: 'DONE',       priority: 'HIGH', assignee: interns[0] },
    { title: 'Build authentication endpoints',   status: 'DONE',       priority: 'HIGH', assignee: interns[1] },
    { title: 'Implement RBAC middleware',        status: 'DONE',       priority: 'HIGH', assignee: interns[2] },
    { title: 'Build AI assistant chat UI',       status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: interns[0] },
    { title: 'Wire up realtime notifications',   status: 'IN_PROGRESS', priority: 'HIGH', assignee: interns[1] },
    { title: 'Train ML model on attendance data', status: 'TODO',     priority: 'MEDIUM', assignee: interns[0] },
    { title: 'Write API documentation',          status: 'TODO',       priority: 'MEDIUM', assignee: interns[0] },
    { title: 'Set up CI/CD pipeline',            status: 'REVIEW',     priority: 'MEDIUM', assignee: interns[1] },
    { title: 'Build user analytics dashboard',   status: 'TODO',       priority: 'LOW',    assignee: interns[0] },
    { title: 'Write integration tests',          status: 'DONE',       priority: 'HIGH',   assignee: interns[2] },
    { title: 'Deploy to staging',                status: 'TODO',       priority: 'URGENT', assignee: interns[3] },
    { title: 'Refactor auth middleware',         status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: interns[1] },
  ];
  for (const t of tasksData) {
    const assignee = t.assignee ?? interns[Math.floor(Math.random() * interns.length)];
    await prisma.projectTask.create({
      data: {
        projectId: project.id,
        assigneeId: assignee.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: new Date(Date.now() + Math.floor(Math.random() * 14) * 86400000),
        completedAt: t.status === 'DONE' ? new Date() : null,
      },
    });
  }

  // ── Q&A sample ─────────────────────────────────────────
  await prisma.question.deleteMany({});
  const q1 = await prisma.question.create({
    data: {
      authorId: interns[0].id,
      title: 'How do I submit my weekly internship report?',
      body: 'New here — what is the exact process?',
      category: 'Reports',
    },
  });
  await prisma.answer.create({
    data: {
      authorId: admin.id,
      questionId: q1.id,
      body: 'Go to Reports → Upload Report. Enter a title (e.g. "Week 1 Progress Report"), paste your markdown, attach any file, and submit.',
      isAccepted: true,
    },
  });

  // ── Attendance ─────────────────────────────────────────
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  // Build all attendance records in one createMany
  const attendanceData = [];
  for (const intern of interns) {
    for (let d = 0; d < 14; d++) {
      const day = new Date(today);
      day.setDate(day.getDate() - d);
      attendanceData.push({
        userId: intern.id,
        date: day,
        status: Math.random() > 0.85 ? 'ABSENT' : 'PRESENT',
        checkIn: new Date(day.getTime() + 10 * 3600 * 1000),
        checkOut: new Date(day.getTime() + 18 * 3600 * 1000),
      });
    }
  }
  await prisma.attendance.createMany({ data: attendanceData, skipDuplicates: true });

  // ── System settings ────────────────────────────────────
  await prisma.systemSetting.upsert({
    where: { key: 'platform.name' },
    update: { value: 'SkillNova' },
    create: { key: 'platform.name', value: 'SkillNova' },
  });
  await prisma.systemSetting.upsert({
    where: { key: 'platform.maintenance' },
    update: { value: false },
    create: { key: 'platform.maintenance', value: false },
  });
  await prisma.systemSetting.upsert({
    where: { key: 'platform.registrationOpen' },
    update: { value: true },
    create: { key: 'platform.registrationOpen', value: true },
  });

  console.log('\n✅  Seed complete!\n');
  console.log('Demo accounts (change passwords immediately in production):');
  console.log('  Super Admin : superadmin@skillnova.com / SuperAdmin#2026');
  console.log('  Admin       : admin@skillnova.com      / Admin#2026');
  console.log('  Mentor      : mentor@skillnova.com     / Mentor#2026');
  console.log('  Intern      : rahul@skillnova.com      / User#2026');
  console.log('  Intern      : user@skillnova.com       / User#2026');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
