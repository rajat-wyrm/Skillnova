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
  return String(value || '')
    .split(/\r?\n|\s*?\s*/)
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
  const ordered = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalHours = ordered.reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0);
  const achievements = ordered.flatMap((log) => splitLines(log.workDone));
  const challenges = uniqueLines(ordered.map((log) => log.challenges).filter(Boolean));
  const technologies = uniqueLines(ordered.map((log) => log.technologiesUsed).filter(Boolean));
  const nextSteps = uniqueLines(ordered.map((log) => log.tomorrowPlan).filter(Boolean));
  const lines = [
    '# Weekly Report',
    '',
    `Week range: ${formatDateOnly(weekStart || ordered[0]?.date || new Date())} - ${formatDateOnly(weekEnd || ordered.at(-1)?.date || new Date())}`,
    '',
    '## Daily Updates',
  ];

  if (!ordered.length) {
    lines.push('', '- No daily logs were found for this week yet.');
  } else {
    for (const log of ordered) {
      lines.push(
        '',
        `### ${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })}`,
        `- Work Done: ${splitLines(log.workDone).join('; ') || 'Not added yet'}`,
        `- Hours Worked: ${Number(log.hoursWorked || 0)}`,
        `- Challenges: ${log.challenges || 'None'}`,
        `- Tomorrow's Plan: ${log.tomorrowPlan || 'Not added yet'}`,
        `- Technologies Used: ${log.technologiesUsed || 'Not added yet'}`,
      );
    }
  }

  lines.push(
    '',
    '## Total Hours Worked',
    `${totalHours.toFixed(1)}`,
    '',
    '## Challenges',
    bulletSection(challenges),
    '',
    '## Achievements',
    bulletSection(achievements),
    '',
    '## Technologies Used',
    bulletSection(technologies),
    '',
    '## Next Steps',
    bulletSection(nextSteps),
  );

  return {
    title: weekStart && weekEnd
      ? `Weekly Report: ${formatDateOnly(weekStart)} - ${formatDateOnly(weekEnd)}`
      : 'Weekly Report Draft',
    content: lines.join('\n'),
    summary: {
      totalHours: Math.round(totalHours * 10) / 10,
      challenges,
      achievements,
      technologies,
      nextSteps,
    },
  };
}
