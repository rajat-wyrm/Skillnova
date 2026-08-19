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

export const getReportStatusMeta = (status) => REPORT_STATUS_META[status] || REPORT_STATUS_META.DRAFT;
export const getReportStatusLabel = (status) => getReportStatusMeta(status).label;
export const reportBadgeVariant = (status) => getReportStatusMeta(status).variant;

export const ratingToStars = (rating = 0) => {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return '\u2B50'.repeat(value);
};

export const formatRating = (rating) => {
  const value = Number(rating);
  if (!Number.isFinite(value)) return 'No rating yet';
  return `${value.toFixed(1)}/5`;
};
