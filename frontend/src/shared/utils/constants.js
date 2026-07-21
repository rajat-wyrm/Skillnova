// ══════════════════════════════════════════════
//  SKILLNOVA — Shared Constants & Design Tokens
// ══════════════════════════════════════════════

export const COLORS = {
  primary:      "#2563EB",
  primaryDark:  "#1D4ED8",
  primaryLight: "#EFF6FF",
  accent:       "#7C3AED",
  accentLight:  "#F5F3FF",
  success:      "#059669",
  warning:      "#D97706",
  danger:       "#DC2626",
  neutral:      "#64748B",
  dark:         "#0F172A",
  surface:      "#F8FAFC",
  white:        "#FFFFFF",
  border:       "#E2E8F0",
};

export const CHART_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626"];

export const ACTIVITY_DATA = [
  { day: "Mon", hours: 2,   tasks: 3 },
  { day: "Tue", hours: 3.5, tasks: 5 },
  { day: "Wed", hours: 1.5, tasks: 2 },
  { day: "Thu", hours: 4,   tasks: 6 },
  { day: "Fri", hours: 5,   tasks: 7 },
  { day: "Sat", hours: 2,   tasks: 3 },
  { day: "Sun", hours: 1,   tasks: 1 },
];

export const SKILL_DATA = [
  { name: "Frontend",    value: 35 },
  { name: "Backend",     value: 25 },
  { name: "AI/ML",       value: 20 },
  { name: "Data Science",value: 20 },
];

export const MOCK_ARTICLES = [
  { id: 1, title: "Getting Started with SkillNova", category: "Onboarding",  views: 234, helpful: 45, author: "Admin",        date: "Mar 10, 2026", tags: ["guide","setup"],      verified: true  },
  { id: 2, title: "How to Submit Weekly Reports",    category: "Reports",     views: 189, helpful: 38, author: "Admin",        date: "Mar 8, 2026",  tags: ["reports","weekly"],   verified: true  },
  { id: 3, title: "Machine Learning Best Practices", category: "Technical",   views: 156, helpful: 29, author: "Priya Patel",  date: "Mar 5, 2026",  tags: ["ML","AI"],            verified: false },
  { id: 4, title: "Project Documentation Template",  category: "Templates",   views: 120, helpful: 22, author: "Admin",        date: "Mar 3, 2026",  tags: ["template","docs"],    verified: true  },
  { id: 5, title: "Meeting Scheduling Process",      category: "Meetings",    views: 98,  helpful: 18, author: "Rahul Sharma", date: "Mar 1, 2026",  tags: ["meetings","calendar"],verified: false },
  { id: 6, title: "Code Review Guidelines",          category: "Technical",   views: 87,  helpful: 15, author: "Amit Verma",   date: "Feb 28, 2026", tags: ["code","review"],      verified: true  },
];

export const MOCK_REPORTS = [
  { id: 1, intern: "Rahul Sharma", title: "Week 1 Progress Report",      date: "Mar 10, 2026", status: "Reviewed", score: 8.5  },
  { id: 2, intern: "Priya Patel",  title: "ML Project Update",           date: "Mar 12, 2026", status: "Pending",  score: null },
  { id: 3, intern: "Amit Singh",   title: "Backend API Development Report", date: "Mar 14, 2026", status: "Reviewed", score: 7.2  },
  { id: 4, intern: "Sneha Reddy",  title: "Frontend UI Report",          date: "Mar 15, 2026", status: "Pending",  score: null },
];

export const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: "Weekly Internship Meeting",        desc: "All interns must attend the weekly project meeting on Monday at 10 AM.", priority: "High",   pinned: true,  date: "Mar 18, 2026" },
  { id: 2, title: "Weekly Report Submission Deadline",desc: "Please submit your internship weekly progress report before Friday evening.", priority: "Medium", pinned: false, date: "Mar 16, 2026" },
  { id: 3, title: "New Knowledge Base Articles Added",desc: "New documentation and tutorials have been added to the Knowledge Base section.", priority: "Low",    pinned: false, date: "Mar 14, 2026" },
  { id: 4, title: "Platform Maintenance Scheduled",   desc: "System maintenance this Sunday 2–4 AM. Platform will be unavailable.", priority: "Medium", pinned: false, date: "Mar 12, 2026" },
];

export const MOCK_USERS = [
  { id: 1, name: "Rahul Sharma", email: "rahul@skillnova.com",  role: "Intern", dept: "AI/ML",        status: "Active",   avatar: "RS", rating: 8.5 },
  { id: 2, name: "Priya Patel",  email: "priya@skillnova.com",  role: "Admin",  dept: "Web Dev",      status: "Active",   avatar: "PP", rating: 9.1 },
  { id: 3, name: "Amit Verma",   email: "amit@skillnova.com",   role: "Intern", dept: "Data Science", status: "Inactive", avatar: "AV", rating: 7.2 },
  { id: 4, name: "Sneha Reddy",  email: "sneha@skillnova.com",  role: "Intern", dept: "Backend",      status: "Active",   avatar: "SR", rating: 8.8 },
];

export const MOCK_INTERNS = [
  { id: 1, name: "Rahul Sharma", department: "AI/ML",        attendance: "Present", task: "Data Preprocessing", status: "Active",   rating: 8  },
  { id: 2, name: "Priya Patel",  department: "Web Dev",      attendance: "Absent",  task: "Frontend UI",        status: "Active",   rating: 9  },
  { id: 3, name: "Amit Verma",   department: "Data Science", attendance: "Present", task: "EDA Analysis",       status: "Inactive", rating: 7  },
  { id: 4, name: "Sneha Reddy",  department: "Backend",      attendance: "Present", task: "API Development",    status: "Active",   rating: 8  },
];