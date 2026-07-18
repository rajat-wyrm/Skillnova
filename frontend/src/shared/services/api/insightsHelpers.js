export const getDashboardList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const parseDashboardDate = value => {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDashboardStatus = (value, fallback = "Pending") => {
  const normalized = String(value || "").trim().toLowerCase();

  if (["reviewed", "approved", "verified"].includes(normalized)) return "Reviewed";
  if (["active", "present"].includes(normalized)) return "Active";
  if (["inactive", "absent"].includes(normalized)) return "Inactive";
  return fallback;
};

const formatDashboardRelativeTime = date => {
  if (!(date instanceof Date)) return "New";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

const getDashboardDays = count =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (count - index - 1));
    return date;
  });

export const buildDashboardDailyCounts = (items, count) =>
  getDashboardDays(count).map(date => {
    const dayKey = date.toDateString();

    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      count: items.filter(item => item.timestamp?.toDateString() === dayKey).length,
    };
  });

export const normalizeDashboardProfile = item => {
  if (!item || typeof item !== "object") {
    return {
      name: "User",
      role: "Member",
      score: null,
      attendance: null,
      skills: [],
    };
  }

  const score = Number.parseFloat(item.rating ?? item.score ?? item.performance);
  const attendance = Number.parseFloat(
    item.attendanceRate ?? item.attendancePercentage ?? item.attendance
  );

  return {
    name: item.name || "User",
    role: item.role || "Member",
    score: Number.isNaN(score) ? null : Number(score.toFixed(1)),
    attendance: Number.isNaN(attendance) ? null : Math.round(attendance),
    skills:
      typeof item.skills === "string"
        ? item.skills
            .split(",")
            .map(skill => skill.trim())
            .filter(Boolean)
        : Array.isArray(item.skills)
          ? item.skills.filter(Boolean)
          : [],
  };
};

export const normalizeDashboardIntern = item => {
  if (!item || typeof item !== "object") return null;

  const rating = Number.parseFloat(item.rating ?? item.score);

  return {
    id: item.id ?? item._id ?? item.email ?? item.name ?? "intern",
    name: item.name || item.fullName || "Unknown intern",
    department: item.department || item.dept || "General",
    attendance:
      String(item.attendance || "").trim().toLowerCase() === "absent" ? "Absent" : "Present",
    status: normalizeDashboardStatus(item.status, "Active"),
    rating: Number.isNaN(rating) ? null : Number(rating.toFixed(1)),
    createdAt: parseDashboardDate(item.createdAt || item.date || item.joinedAt),
  };
};

export const normalizeDashboardUser = item => {
  if (!item || typeof item !== "object") return null;

  return {
    id: item.id ?? item._id ?? item.email ?? item.name ?? "user",
    name: item.name || item.fullName || "Unknown user",
    status: normalizeDashboardStatus(item.status, "Active"),
    role: item.role || "User",
    createdAt: parseDashboardDate(item.createdAt || item.updatedAt || item.date),
  };
};

export const normalizeDashboardReport = item => {
  if (!item || typeof item !== "object") return null;

  const score = Number.parseFloat(item.score ?? item.rating);
  const timestamp = parseDashboardDate(
    item.date || item.submittedAt || item.createdAt || item.updatedAt
  );

  return {
    id: item.id ?? item._id ?? item.title ?? "report",
    title: item.title || item.name || "Untitled report",
    status: normalizeDashboardStatus(item.status),
    score: Number.isNaN(score) ? null : Number(score.toFixed(1)),
    timestamp,
    actor: item.intern || item.internName || item.user || "Unknown user",
  };
};

export const normalizeDashboardArticle = item => {
  if (!item || typeof item !== "object") return null;

  return {
    id: item.id ?? item._id ?? item.title ?? "article",
    title: item.title || "Untitled article",
    category: item.category || "General",
    verified: Boolean(item.verified),
    timestamp: parseDashboardDate(item.updatedAt || item.createdAt || item.date),
  };
};

export const normalizeDashboardAnnouncement = item => {
  if (!item || typeof item !== "object") return null;

  return {
    id: item.id ?? item._id ?? item.title ?? "announcement",
    title: item.title || item.message || item.text || "New announcement",
    priority: String(item.priority || "").toLowerCase(),
    pinned: Boolean(item.pinned),
    timestamp: parseDashboardDate(
      item.createdAt || item.updatedAt || item.date || item.publishedAt
    ),
  };
};

export const normalizeDashboardMilestone = (item, index) => {
  if (!item || typeof item !== "object") return null;

  return {
    id: item.id ?? `milestone-${index}`,
    title: item.title || item.name || `Task ${index + 1}`,
    status: String(item.status || "").trim().toLowerCase() || "not-started",
  };
};

export const buildAdminRecentActions = ({ reports, users, articles, announcements }) =>
  [
    ...reports
      .filter(item => item.timestamp)
      .map(item => ({
        action: item.status === "Reviewed" ? "Report reviewed" : "Report submitted",
        detail: `${item.title} · ${item.actor}`,
        time: formatDashboardRelativeTime(item.timestamp).replace(" ago", ""),
        sortValue: item.timestamp.getTime(),
        color: item.status === "Reviewed" ? "green" : "orange",
      })),
    ...users
      .filter(item => item.createdAt)
      .map(item => ({
        action: "User updated",
        detail: `${item.name} · ${item.role}`,
        time: formatDashboardRelativeTime(item.createdAt).replace(" ago", ""),
        sortValue: item.createdAt.getTime(),
        color: item.status === "Active" ? "green" : "dark",
      })),
    ...articles
      .filter(item => item.timestamp)
      .map(item => ({
        action: item.verified ? "Article verified" : "Article updated",
        detail: item.title,
        time: formatDashboardRelativeTime(item.timestamp).replace(" ago", ""),
        sortValue: item.timestamp.getTime(),
        color: item.verified ? "green" : "orange",
      })),
    ...announcements
      .filter(item => item.timestamp)
      .map(item => ({
        action: "Announcement posted",
        detail: item.title,
        time: formatDashboardRelativeTime(item.timestamp).replace(" ago", ""),
        sortValue: item.timestamp.getTime(),
        color: item.pinned || item.priority === "high" ? "orange" : "dark",
      })),
  ]
    .sort((left, right) => right.sortValue - left.sortValue)
    .slice(0, 5);

export const buildUserRecentActivity = ({ reports, announcements, articles }) =>
  [
    ...reports
      .filter(item => item.timestamp)
      .map(item => ({
        icon: item.status === "Reviewed" ? "✅" : "📄",
        text:
          item.status === "Reviewed"
            ? `Report reviewed: ${item.title}`
            : `Submitted report: ${item.title}`,
        time: formatDashboardRelativeTime(item.timestamp),
        sortValue: item.timestamp.getTime(),
      })),
    ...announcements
      .filter(item => item.timestamp)
      .map(item => ({
        icon: item.pinned || item.priority === "high" ? "📢" : "🔔",
        text: item.title,
        time: formatDashboardRelativeTime(item.timestamp),
        sortValue: item.timestamp.getTime(),
      })),
    ...articles
      .filter(item => item.timestamp)
      .map(item => ({
        icon: "📚",
        text: `Knowledge update: ${item.title}`,
        time: formatDashboardRelativeTime(item.timestamp),
        sortValue: item.timestamp.getTime(),
      })),
  ]
    .sort((left, right) => right.sortValue - left.sortValue)
    .slice(0, 4);

export const getDashboardSkillDistribution = (distribution, skills) => {
  if (Array.isArray(distribution) && distribution.length > 0) {
    return distribution
      .map(item => ({
        name: item?.name || item?.label || "Skill",
        value: Number.parseFloat(item?.value) || 0,
      }))
      .filter(item => item.value > 0);
  }

  if (!Array.isArray(skills) || skills.length === 0) return [];

  const limitedSkills = skills.slice(0, 5);
  const percentage = Math.floor(100 / limitedSkills.length);
  const remainder = 100 - percentage * limitedSkills.length;

  return limitedSkills.map((skill, index) => ({
    name: skill,
    value: percentage + (index === 0 ? remainder : 0),
  }));
};

export const getDashboardPendingTasks = (milestones, reports) => {
  const milestoneTasks = milestones
    .filter(item => item.status !== "completed")
    .map(item => ({
      title: item.title,
      priority: item.status === "in-progress" ? "High" : "Medium",
      due: item.status === "in-progress" ? "In Progress" : "Planned",
    }));

  if (milestoneTasks.length > 0) {
    return milestoneTasks.slice(0, 4);
  }

  return reports
    .filter(item => item.status === "Pending")
    .slice(0, 4)
    .map(item => ({
      title: item.title,
      priority: "High",
      due: "Pending",
    }));
};

const getDashboardRecentMonths = count =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - (count - index - 1));
    return date;
  });

export const buildDashboardMonthlyCounts = (items, count) =>
  getDashboardRecentMonths(count).map(date => {
    const year = date.getFullYear();
    const month = date.getMonth();

    return {
      label: date.toLocaleDateString("en-US", { month: "short" }),
      count: items.filter(
        item =>
          item.timestamp &&
          item.timestamp.getFullYear() === year &&
          item.timestamp.getMonth() === month
      ).length,
    };
  });

const getDashboardRecentWeeks = count =>
  Array.from({ length: count }, (_, index) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay() - 7 * (count - index - 1));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
      label: `W${index + 1}`,
      start,
      end,
    };
  });

export const buildDashboardWeeklyReportCounts = (reports, count) =>
  getDashboardRecentWeeks(count).map(week => ({
    week: week.label,
    submitted: reports.filter(
      item => item.timestamp && item.timestamp >= week.start && item.timestamp <= week.end
    ).length,
    reviewed: reports.filter(
      item =>
        item.timestamp &&
        item.status === "Reviewed" &&
        item.timestamp >= week.start &&
        item.timestamp <= week.end
    ).length,
  }));

export const buildDashboardDepartmentDistribution = interns => {
  const counts = interns.reduce((accumulator, intern) => {
    const key = intern.department || "General";
    accumulator.set(key, (accumulator.get(key) || 0) + 1);
    return accumulator;
  }, new Map());

  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
};

export const buildAdminTaskSummary = (interns, reports) =>
  interns.map(intern => ({
    name: intern.name,
    department: intern.department,
    score: intern.rating ?? 0,
    tasks: reports.filter(report => report.actor === intern.name).length,
    status: intern.status,
  }));

export const buildUserTaskProgress = (analytics, skillDistribution, reports) => {
  if (Array.isArray(analytics) && analytics.length > 0) {
    return analytics.slice(0, 5).map(item => ({
      task: item.label || item.name || "Task",
      completion: Math.max(0, Math.min(100, Number.parseFloat(item.value) || 0)),
    }));
  }

  if (Array.isArray(skillDistribution) && skillDistribution.length > 0) {
    return skillDistribution.slice(0, 5).map(item => ({
      task: item.name,
      completion: Math.max(0, Math.min(100, Number.parseFloat(item.value) || 0)),
    }));
  }

  return reports.slice(0, 5).map((item, index) => ({
    task: item.title || `Task ${index + 1}`,
    completion: item.status === "Reviewed" ? 100 : 60,
  }));
};

export const buildUserStrengths = (skillDistribution, profile, reports) => {
  const strengths = [];

  skillDistribution.slice(0, 3).forEach(item => {
    strengths.push({
      label: item.name,
      score: Math.max(55, Math.min(100, Number.parseFloat(item.value) || 0)),
    });
  });

  if (profile.attendance !== null) {
    strengths.push({
      label: "Consistency",
      score: profile.attendance,
    });
  }

  const reviewedReports = reports.filter(item => item.status === "Reviewed").length;
  if (reports.length > 0) {
    strengths.push({
      label: "Execution",
      score: Math.round((reviewedReports / reports.length) * 100),
    });
  }

  if (profile.score !== null) {
    strengths.push({
      label: "Performance",
      score: Math.round(Math.min(100, profile.score * 10)),
    });
  }

  return strengths.slice(0, 5);
};

