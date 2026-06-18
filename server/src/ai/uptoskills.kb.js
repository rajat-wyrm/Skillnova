// ════════════════════════════════════════════════════════════
//  UptoSkills Knowledge Base — SkillNova edition
//  Curated content used to ground the AI assistant.
// ════════════════════════════════════════════════════════════
export const UPTOSKILLS_KB = {
  company: {
    name: 'UptoSkills',
    mission:
      'Empowering students and early-career professionals with industry-ready skills through project-based learning, expert mentorship and career support.',
    founded: 2019,
    programs: [
      'AI/ML Internship',
      'Web Development Internship',
      'Data Science Internship',
      'Cloud & DevOps Internship',
      'UI/UX Design Internship',
      'Cyber Security Internship',
    ],
    contact: {
      website: 'https://uptoskills.com',
      email: 'support@uptoskills.com',
      phone: '+91-9205476611',
    },
  },

  platform: {
    name: 'SkillNova',
    tagline: 'The unified intern management platform',
    description:
      'SkillNova is UptoSkills\' internal platform for managing intern onboarding, daily tasks, weekly reports, mentorship, knowledge sharing and AI-assisted learning.',
    modules: [
      'Dashboard',
      'Project Flow',
      'Knowledge Base',
      'Q&A Forum',
      'Reports',
      'Meetings',
      'Announcements',
      'Analytics',
      'AI Assistant',
    ],
  },

  onboarding: [
    {
      title: 'Welcome to SkillNova',
      body:
        'Welcome aboard! Complete your profile, attend the orientation session, and set up your mentor meeting within the first 48 hours.',
    },
    {
      title: 'Setting up your environment',
      body:
        'Install Node.js 20+, Git, VS Code and Docker Desktop. Clone the SkillNova monorepo and run `npm install && npm run dev` to get the app running locally.',
    },
    {
      title: 'Communication norms',
      body:
        'Slack is for synchronous chat. Email is for formal communication. Use the SkillNova Q&A forum for technical questions so other interns can benefit from the answers.',
    },
  ],

  reports: {
    cadence: 'Weekly',
    deadline: 'Every Friday 6:00 PM IST',
    sections: ['Goals for the week', 'What was completed', 'Blockers', 'Plan for next week', 'Learnings'],
    tips: [
      'Be specific — quantify your work where possible (e.g. "shipped 3 PRs", "reduced API latency by 18%").',
      'Include screenshots or Loom links for visual progress.',
      'Always list blockers early so your mentor can unblock you.',
    ],
  },

  attendance: {
    policy:
      'Interns are expected to maintain at least 90% attendance. Mark your check-in before 10:00 AM and check-out after 6:00 PM. Approved leave must be requested at least 24 hours in advance via the SkillNova Attendance page.',
    graceMinutes: 15,
  },

  mentorship: {
    cadence: 'Weekly 1:1, 30 minutes',
    agenda: ['Updates', 'Blockers', 'Learning goals', 'Feedback', 'Action items'],
  },

  code_of_conduct: [
    'Be respectful and inclusive in every interaction.',
    'Give and receive constructive feedback graciously.',
    'Protect confidential information about the company and its users.',
    'Credit your peers when you build on their ideas.',
    'Report any concerns to your mentor or the HR team immediately.',
  ],

  faqs: [
    {
      q: 'How do I submit my weekly report?',
      a: 'Go to Reports → "Upload Report", enter a title (e.g. "Week 4 Progress Report"), paste your markdown, attach any file, and submit. Your mentor will be notified automatically.',
    },
    {
      q: 'Where can I find project documentation?',
      a: 'All internal docs live in the Knowledge Base module. Filter by category (Technical / Onboarding / Templates) or use the global search.',
    },
    {
      q: 'How do I schedule a meeting with my mentor?',
      a: 'Open Meetings → "Schedule meeting", pick a slot, and your mentor will get a calendar invite plus a SkillNova notification.',
    },
    {
      q: 'Can I work remotely?',
      a: 'Yes, UptoSkills supports hybrid and fully remote internships. Coordinate your schedule with your mentor and keep your attendance up to date.',
    },
    {
      q: 'How is my performance evaluated?',
      a: 'We look at the quality and consistency of your weekly reports, the impact of your merged PRs, peer feedback and your final project demo. Scores are visible on your Profile.',
    },
    {
      q: 'What is the AI Assistant?',
      a: 'The AI Assistant is grounded on the SkillNova knowledge base and UptoSkills company info. Ask it anything about the platform, your onboarding, report writing, or career guidance.',
    },
  ],

  glossary: {
    '1:1':
      'A private weekly meeting between an intern and their mentor to align on goals and unblock work.',
    KB: 'Knowledge Base — searchable library of articles, templates and FAQs.',
    PR: 'Pull Request — proposed code changes awaiting review.',
    SLA: 'Service Level Agreement — a commitment about response or resolution time.',
  },
};

export default UPTOSKILLS_KB;
