// ════════════════════════════════════════════════════════════
//  ADMIN — pages/Reports.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { FileText, Loader2, CheckCircle, Star, X } from 'lucide-react';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';

const FILTERS = ['ALL', 'PENDING', 'REVIEWED', 'REJECTED'];

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl ${className}`} style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: { background: 'var(--badge-default-bg)', color: 'var(--badge-default-fg)', border: '1px solid var(--badge-default-border)' },
    success: { background: 'var(--badge-success-bg)', color: 'var(--badge-success-fg)', border: '1px solid var(--badge-success-border)' },
    warning: { background: 'var(--badge-warning-bg)', color: 'var(--badge-warning-fg)', border: '1px solid var(--badge-warning-border)' },
    danger: { background: 'var(--badge-danger-bg)', color: 'var(--badge-danger-fg)', border: '1px solid var(--badge-danger-border)' },
  };
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={variants[variant] || variants.default}>{children}</span>;
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-6">
    <div className="min-w-0">
      <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
      {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{subtitle}</p>}
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors" type="button"><X size={18} /></button>
          </div>
          <div className="p-6">{children}</div>
          {footer && <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">{footer}</div>}
        </div>
      </div>
    </>
  );
};

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports', { params: { limit: 50, status: filter === 'ALL' ? undefined : filter } });
      setReports(data.items);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [filter]);

  const review = async () => {
    try {
      await api.patch(`/reports/${reviewing.id}/review`, { status: 'REVIEWED', score: score ? Number(score) : undefined, feedback });
      notify.success('Report reviewed.');
      setReviewing(null); setScore(''); setFeedback('');
      fetch();
    } catch (err) { notify.error(err.response?.data?.error || 'Failed.'); }
  };

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'PENDING').length,
    reviewed: reports.filter((r) => r.status === 'REVIEWED').length,
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Intern Reports" subtitle="Review, approve and manage weekly progress reports" />

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(37,99,235,0.12)', color: '#1D4ED8' }}>
          <FileText size={14} /> {stats.total} shown
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
          {stats.pending} pending
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(0,190,163,0.12)', color: '#00bea3' }}>
          {stats.reviewed} reviewed
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-3 rounded-xl flex-shrink-0" style={{ background: r.status === 'REVIEWED' ? 'rgba(0,190,163,0.15)' : r.status === 'REJECTED' ? 'rgba(220,38,38,0.15)' : 'rgba(245,158,11,0.15)' }}>
                  <FileText size={20} style={{ color: r.status === 'REVIEWED' ? '#00bea3' : r.status === 'REJECTED' ? '#dc2626' : '#d97706' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white break-words">{r.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{r.user?.name} · Week {r.weekNumber ?? '—'} · {formatDate(r.submittedAt)}</p>
                  {r.feedback && <p className="text-xs mt-1 italic" style={{ color: 'var(--muted)' }}>“{r.feedback}”</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === 'REVIEWED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'}>{r.status}</Badge>
                {r.score != null && <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full"><Star size={10} className="inline" /> {r.score}/10</span>}
                {r.status === 'PENDING' && (
                  <button onClick={() => { setReviewing(r); setScore(''); setFeedback(''); }} className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-medium" style={{ background: '#ff6d34' }}>
                    <CheckCircle size={12} /> Review
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {reports.length === 0 && <div className="text-center py-16 text-slate-400"><FileText size={40} className="mx-auto mb-3 opacity-30" /><p>No reports in this view.</p></div>}
      </div>

      <Modal isOpen={!!reviewing} onClose={() => setReviewing(null)} title="Review report"
        footer={
          <>
            <button onClick={() => setReviewing(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={review} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ background: '#00bea3' }}>Mark Reviewed</button>
          </>
        }>
        {reviewing && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">{reviewing.title}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{reviewing.user?.name} · {formatDate(reviewing.submittedAt)}</p>
            <pre className="text-xs whitespace-pre-wrap p-3 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text)', maxHeight: 220, overflow: 'auto' }}>{reviewing.content || '(no content)'}</pre>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>Score (0–10)</label>
                <input type="number" min="0" max="10" step="0.1" value={score} onChange={(e) => setScore(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>Feedback</label>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReports;
