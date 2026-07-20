  export const REPORT_STATUS_META = {
  DRAFT: { label: 'Draft', variant: 'gray' },
  SUBMITTED: { label: 'Submitted', variant: 'warning' },
  UNDER_REVIEW: { label: 'Under Review', variant: 'purple' },
  REVIEWED: { label: 'Reviewed', variant: 'success' },
  NEEDS_REVISION: { label: 'Needs Revision', variant: 'danger' },
  APPROVED: { label: 'Approved', variant: 'success' },
  PENDING: { label: 'Pending', variant: 'warning' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
};

export const FINAL_REPORT_STATUSES = new Set(['REVIEWED', 'APPROVED', 'REJECTED']);
export const EDITABLE_REPORT_STATUSES = new Set(['DRAFT', 'NEEDS_REVISION']);
export const ACTIVE_REVIEW_STATUSES = new Set(['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'PENDING']);

export function getReportStatusMeta(status) {
  return REPORT_STATUS_META[status] || REPORT_STATUS_META.DRAFT;
}

export function toDateKey(input) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function toUtcDateOnly(input) {
  const key = toDateKey(input);
  return key ? new Date(`${key}T00:00:00.000Z`) : null;
}

export function startOfWeek(date = new Date()) {
  const key = toDateKey(date);
  if (!key) return new Date();
  const base = new Date(`${key}T00:00:00.000Z`);
  const day = base.getUTCDay();
  const diff = (day + 6) % 7;
  base.setUTCDate(base.getUTCDate() - diff);
  return base;
}

export function endOfWeek(date = new Date()) {
  const start = startOfWeek(date);
  start.setUTCDate(start.getUTCDate() + 6);
  return start;
}

export function formatDateOnly(date) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n|,|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function uniqueLines(values) {
  return [...new Set(values.flatMap(splitLines))].filter(Boolean);
}

function bulletSection(items) {
  if (!items.length) return '- Not added yet';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildWeeklyReportDraft(logs, { weekStart, weekEnd } = {}) {
  const ordered = [...logs].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const totalHours = ordered.reduce(
    (sum, log) => sum + Number(log.hoursWorked || 0),
    0
  );

  const achievements = uniqueLines(
  ordered.map((log) => log.workDone).filter(Boolean)
);
  const challenges = uniqueLines(
    ordered.map((log) => log.challenges).filter(Boolean)
  );
  const technologies = uniqueLines(
    ordered.map((log) => log.technologiesUsed).filter(Boolean)
  );
  const nextSteps = uniqueLines(
    ordered.map((log) => log.tomorrowPlan).filter(Boolean)
  );

  const lines = [];

  lines.push(
    "# 📄 WEEKLY INTERNSHIP PROGRESS REPORT",
    "",
    `**Week:** ${formatDateOnly(
      weekStart || ordered[0]?.date || new Date()
    )} - ${formatDateOnly(
      weekEnd || ordered.at(-1)?.date || new Date()
    )}`,
    "",
    `**Generated On:** ${formatDateOnly(new Date())}`,
    "",
    "---",
    "",
    "## 📌 Executive Summary",
    "",
    `This week, ${ordered.length} working day(s) were logged with a total of **${totalHours.toFixed(
      1
    )} hours** of development work. The focus was on completing assigned tasks, resolving technical challenges, and improving project functionality.`,
    "",
    "---",
    "",
    "## 📊 Weekly Statistics",
    "",
    `| Metric | Value |`,
    `|-------|------:|`,
    `| Working Days | ${ordered.length} |`,
    `| Total Hours Worked | ${totalHours.toFixed(1)} |`,
    `| Tasks Completed | ${achievements.length} |`,
    `| Technologies Used | ${technologies.length} |`,
    `| Challenges Faced | ${challenges.length} |`,
    "",
    "---",
    "",
    "## 📅 Daily Progress"
  );

  if (!ordered.length) {
    lines.push("", "No daily work logs were added this week.");
  } else {
    ordered.forEach((log) => {
      const day = new Date(log.date).toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      });

      lines.push(
        "",
        `### ${day}`,
        "",
        `**📝 Tasks Completed**`,
        ...splitLines(log.workDone).map((task) => `- ${task}`),
        "",
        `**⏰ Hours Worked**`,
        `${Number(log.hoursWorked || 0)} Hours`,
        "",
        `**💻 Technologies Used**`,
        log.technologiesUsed
          ? bulletSection(splitLines(log.technologiesUsed))
          : "- None",
        "",
        `**⚠ Challenges Faced**`,
        log.challenges ? bulletSection(splitLines(log.challenges)) : "- None",
        "",
        "---"
      );
    });
  }

  lines.push(
    "",
    "## 🏆 Key Achievements",
    "",
    bulletSection(achievements),
    "",
    "---",
    "",
    "## 💻 Technologies Used During the Week",
    "",
    bulletSection(technologies),
    "",
    "---",
    "",
    "## ⚠ Challenges Faced",
    "",
    bulletSection(challenges),
    "",
    "---",
    "",
    "## 🚀 Plan for Next Week",
    "",
    bulletSection(nextSteps),
    "",
    "---",
    "",
    "## ✅ Weekly Conclusion",
    "",
    `The assigned work for the week was completed successfully with **${totalHours.toFixed(
      1
    )} hours** of productive effort. Progress was made towards project objectives while addressing technical issues and improving implementation quality.`,
    "",
    "---",
    "",
    "_End of Weekly Report_"
  );

  return {
    title:
      weekStart && weekEnd
        ? `Weekly Report (${formatDateOnly(
            weekStart
          )} - ${formatDateOnly(weekEnd)})`
        : "Weekly Report",
    content: lines.join("\n"),
    summary: {
      totalHours: Math.round(totalHours * 10) / 10,
      challenges,
      achievements,
      technologies,
      nextSteps,
    },
  };
}
