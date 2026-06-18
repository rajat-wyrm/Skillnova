// ════════════════════════════════════════════════════════════
//  LoaderScreen — full-page loader
// ════════════════════════════════════════════════════════════
const LoaderScreen = ({ label = 'Loading…' }) => (
  <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
        style={{ borderTopColor: '#ff6d34', borderRightColor: '#00bea3' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  </div>
);

export default LoaderScreen;
