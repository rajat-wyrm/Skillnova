// Mentor — Reports review
import { useEffect, useState, useCallback } from 'react';
import { FileText, Loader2, CheckCircle, X } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate, formatRelative } from '../../lib/utils';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports', { params: { limit: 50, status: filter === 'ALL' ? undefined : filter } });
      setReports(data.items);
    } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { fetch(); }, [fetch]);

  const submitReview = async () => {
    try {
      await api.patch(`/reports/${reviewOpen.id}/review`, {
        status: 'REVIEWED',
        score: score ? Number(score) : undefined,
        feedback: feedback || undefined,
      });
      notify.success('Report reviewed.');
      setReviewOpen(null);
      setScore(''); setFeedback('');
      fetch();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed.');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Reports to Review" subtitle="Review and rate intern weekly reports" />

      <div className="flex gap-2 flex-wrap">
        {['PENDING', 'REVIEWED', 'ALL'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <Card key={r.id} className="p-5 cursor-pointer" onClick={() => { setReviewOpen(r); setScore(r.score ?? ''); setFeedback(r.feedback ?? ''); }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-3 rounded-xl flex-shrink-0"
                  style={{ background: r.status === 'REVIEWED' ? 'rgba(0,190,163,0.15)' : 'rgba(124,58,237,0.15)' }}>
                  <FileText size={20} style={{ color: r.status === 'REVIEWED' ? '#00bea3' : '#7C3AED' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white break-words">{r.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{r.user?.name} · Week {r.weekNumber ?? '—'} · {formatRelative(r.submittedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === 'REVIEWED' ? 'success' : 'warning'}>{r.status}</Badge>
                {r.score != null && <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{r.score}/10</span>}
              </div>
            </div>
          </Card>
        ))}
        {reports.length === 0 && (
          <div className="text-center py-16 text-slate-400"><FileText size={40} className="mx-auto mb-3 opacity-30 mx-auto" /><p>No reports in this view.</p></div>
        )}
      </div>

      <Modal isOpen={!!reviewOpen} onClose={() => setReviewOpen(null)} title="Review report"
        footer={
          <>
            <button onClick={() => setReviewOpen(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={submitReview} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ background: '#7C3AED' }}>
              <CheckCircle size={14} /> Save Review
            </button>
          </>
        }>
        {reviewOpen && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">{reviewOpen.title}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{reviewOpen.user?.name} · {formatDate(reviewOpen.submittedAt)}</p>
            <pre className="text-xs whitespace-pre-wrap p-3 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text)', maxHeight: 200, overflow: 'auto' }}>{reviewOpen.content || '(no content)'}</pre>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>Score (0–10)</label>
                <input type="number" min="0" max="10" step="0.1" value={score} onChange={(e) => setScore(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>Status</label>
                <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg)' }}>REVIEWED</div>
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

export default Reports;
