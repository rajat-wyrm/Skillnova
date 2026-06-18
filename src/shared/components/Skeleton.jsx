// ════════════════════════════════════════════════════════════
//  Skeleton components — premium loading states
// ════════════════════════════════════════════════════════════
export const Skeleton = ({ className = '', style }) => (
  <span className={`skeleton inline-block ${className}`} style={{ width: '100%', height: 12, ...style }} />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} style={{ height: 12, width: i === lines - 1 ? '70%' : '100%' }} />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`rounded-2xl p-5 ${className}`} style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="rounded-lg" style={{ width: 40, height: 40 }} />
      <div className="flex-1 space-y-2">
        <Skeleton style={{ height: 10, width: '40%' }} />
        <Skeleton style={{ height: 8, width: '60%' }} />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonStat = ({ className = '' }) => (
  <div className={`rounded-2xl p-5 ${className}`} style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
    <Skeleton style={{ height: 10, width: '50%' }} />
    <Skeleton className="mt-3" style={{ height: 24, width: '40%' }} />
    <Skeleton className="mt-3" style={{ height: 8, width: '70%' }} />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
    <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} style={{ height: 10, width: '60%' }} />)}
      </div>
    </div>
    <div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-5 py-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, borderTop: '1px solid var(--border)' }}>
          {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} style={{ height: 12, width: c === 0 ? '80%' : '60%' }} />)}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart = ({ height = 220 }) => (
  <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
    <Skeleton style={{ height: 12, width: '30%' }} />
    <div className="mt-4 flex items-end gap-1.5" style={{ height }}>
      {[40, 65, 50, 80, 55, 70, 90, 60, 75, 85, 50, 70].map((h, i) => (
        <Skeleton key={i} className="rounded-t" style={{ height: `${h}%`, flex: 1 }} />
      ))}
    </div>
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

export default Skeleton;
