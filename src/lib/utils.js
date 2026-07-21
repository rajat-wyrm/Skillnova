// ════════════════════════════════════════════════════════════
//  Date / utility helpers
// ════════════════════════════════════════════════════════════
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatDate = (d, fmt = 'MMM d, yyyy') => {
  if (!d) return '';
  try {
    return format(typeof d === 'string' ? parseISO(d) : d, fmt);
  } catch {
    return '';
  }
};

export const formatRelative = (d) => {
  if (!d) return '';
  try {
    return formatDistanceToNow(typeof d === 'string' ? parseISO(d) : d, { addSuffix: true });
  } catch {
    return '';
  }
};

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || '?';

export const cn = (...args) => args.filter(Boolean).join(' ');
