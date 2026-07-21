// ════════════════════════════════════════════════════════════
//  Skeleton components — premium loading states
// ════════════════════════════════════════════════════════════
import { Loader2 } from 'lucide-react';

export const PageLoader = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 animate-fadeIn">
    <Loader2 className="animate-spin" size={28} style={{ color: 'var(--brand-orange, #ff6d34)' }} />
    <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
    {Icon && (
      <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ background: 'var(--input-bg)' }}>
        <Icon size={26} style={{ color: 'var(--muted)' }} />
      </div>
    )}
    <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
    {description && <p className="text-sm mt-1 max-w-md mx-auto" style={{ color: 'var(--muted)' }}>{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const EmptyStateInline = ({ icon: Icon, title, description }) => (
  <div className="py-12 text-center">
    {Icon && <Icon size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--muted)' }} />}
    <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{title}</p>
    {description && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{description}</p>}
  </div>
);

export const SkillGapSkeleton = () => (
  <div className="space-y-4 animate-fadeIn">
    <div className="flex gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-24 rounded-xl flex-1" />
      ))}
    </div>
    <div className="skeleton h-64 rounded-xl" />
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton h-32 rounded-xl" />
      ))}
    </div>
  </div>
);

export const AuditLogSkeleton = () => (
  <div className="space-y-3 animate-fadeIn">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 rounded w-1/3" />
          <div className="skeleton h-3 rounded w-2/3" />
        </div>
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    ))}
  </div>
);

export const ReportsSkeleton = () => (
  <div className="space-y-4 animate-fadeIn">
    <div className="skeleton h-10 rounded-xl w-64" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton h-40 rounded-xl" />
      ))}
    </div>
  </div>
);

export const AttendanceSkeleton = () => (
  <div className="space-y-4 animate-fadeIn">
    <div className="skeleton h-32 rounded-xl" />
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="skeleton aspect-square rounded-lg" />
      ))}
    </div>
  </div>
);
