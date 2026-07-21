
// Admin - pages/Reports.jsx
import { useEffect, useState, useCallback } from 'react';
import { Eye, FileText, Loader2, RefreshCw, CheckCircle, Star } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate, formatRelative } from '../../lib/utils';
import { getReportStatusLabel, reportBadgeVariant, ratingToStars, formatRating } from '../../shared/config/reports';

const FILTERS = ['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'REJECTED', 'REVIEWED'];
const ratingButtons = [1, 2, 3, 4, 5];

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rating, setRating] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('APPROVED');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [reportsRes, statsRes] = await Promise.all([
          api.get('/reports', { params: { limit: 50, status: filter === 'ALL' ? undefined : filter } }),
          api.get('/reports/stats'),
        ]);
        setReports(reportsRes.data.items || []);
        setStats(statsRes.data);
      } catch (err) {
        notify.error(err.response?.data?.error || 'Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filter]);

  const openReview = async (report) => {
    setReviewing(report);
    setDetail(report);
    setDetailLoading(true);
    setRating(report.latestReview?.rating ? String(report.latestReview.rating) : report.score ? String(Math.round(report.score / 2)) : '');
    setFeedback(report.latestReview?.feedback || report.feedback || '');
    setStatus(report.status === 'NEEDS_REVISION' ? 'NEEDS_REVISION' : '');
    try {
      const { data } = await api.get(`/reports/${report.id}`);
      setDetail(data.report);
      setRating(data.report.latestReview?.rating ? String(data.report.latestReview.rating) : data.report.score ? String(Math.round(data.report.score / 2)) : '');
      setFeedback(data.report.latestReview?.feedback || data.report.feedback || '');
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to load report details.');
    } finally {
      setDetailLoading(false);
    }
  };
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports', { params: { limit: 50, status: filter === 'ALL' ? undefined : filter } });
      setReports(data.items);
    } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { fetch(); }, [fetch]);

  const review = async () => {
    if (!reviewing) return;
    if (!status) {
      notify.error('Please select a decision.');
      return;
    }
    if (!feedback.trim()) {
      notify.error('Feedback is required.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.patch(`/reports/${reviewing.id}/review`, {
        status,
        rating: rating ? Number(rating) : undefined,
        feedback: feedback.trim(),
      });
      notify.success('Report reviewed.');
      setReports((prev) => prev.map((report) => (report.id === data.report.id ? data.report : report)));
      setReviewing(null);
      setDetail(null);
      setRating('');
      setFeedback('');
      setStatus('');
      fetch();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to save review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Intern Reports" subtitle="Review weekly reports generated from daily logs." action={<button onClick={fetch} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" style={{ color: 'var(--text)' }}><RefreshCw size={15} /> Refresh</button>} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Total Reports</p><p className="text-3xl font-black mt-2" style={{ color: 'var(--text)' }}>{stats?.total ?? reports.length}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Pending Review</p><p className="text-3xl font-black mt-2" style={{ color: 'var(--text)' }}>{stats?.pendingReview ?? reports.filter((r) => ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION'].includes(r.status)).length}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Average Rating</p><p className="text-3xl font-black mt-2" style={{ color: 'var(--text)' }}>{formatRating(stats?.averageRating)}</p></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-3 rounded-xl flex-shrink-0" style={{ background: r.status === 'APPROVED' ? 'rgba(0,190,163,0.15)' : r.status === 'NEEDS_REVISION' ? 'rgba(220,38,38,0.15)' : 'rgba(37,99,235,0.15)' }}>
                  <FileText size={20} style={{ color: r.status === 'APPROVED' ? '#00bea3' : r.status === 'NEEDS_REVISION' ? '#dc2626' : '#1D4ED8' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white break-words">{r.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{r.user?.name} ? Week {r.weekNumber ?? '?'} ? {formatRelative(r.submittedAt)}</p>
                  {r.latestReview?.feedback && <p className="text-xs mt-1 italic" style={{ color: 'var(--muted)' }}>?{r.latestReview.feedback}?</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={reportBadgeVariant(r.status)}>{getReportStatusLabel(r.status)}</Badge>
                {r.latestReview?.rating != null && <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">{ratingToStars(r.latestReview.rating)} {formatRating(r.latestReview.rating)}</span>}
                <button onClick={() => openReview(r)} className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-medium" style={{ background: '#ff6d34' }}>
                  <Eye size={12} /> Review
                </button>
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
            <button
              onClick={review}
              disabled={!status || !feedback.trim() || submitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${!status || !feedback.trim() || submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ background: '#00bea3' }}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </>
        }>
        {reviewing && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{reviewing.title}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{reviewing.user?.name} ? {formatDate(reviewing.submittedAt)}</p>
            </div>
            {detailLoading ? <div className="py-8 flex justify-center"><Loader2 className="animate-spin" size={24} /></div> : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Weekly Status</p>
                    <Badge variant={reportBadgeVariant(detail?.status || reviewing.status)}>{getReportStatusLabel(detail?.status || reviewing.status)}</Badge>
                    <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Week {detail?.weekNumber ?? reviewing.weekNumber ?? '?'}</p>
                  </div>
                  <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Rating</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {ratingButtons.map((item) => (
                        <button key={item} type="button" onClick={() => setRating(String(item))} className={`px-3 py-2 rounded-xl border text-sm font-semibold transition ${String(item) === rating ? 'text-white' : ''}`} style={{ background: String(item) === rating ? '#ff6d34' : 'var(--card)', borderColor: 'var(--border)' }}>{'?'.repeat(item)}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>Decision</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['APPROVED', 'Approve'],
                      ['NEEDS_REVISION', 'Needs Revision'],
                      ['REJECTED', 'Reject'],
                      ['UNDER_REVIEW', 'Under Review'],
                      ['REVIEWED', 'Reviewed'],
                    ].map(([value, label]) => (
                      <button key={value} type="button" onClick={() => setStatus(value)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${status === value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} style={{ background: status === value ? '#7c3aed' : 'var(--card)', borderColor: 'var(--border)' }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>Weekly Report</label>
                  <pre className="text-xs whitespace-pre-wrap p-4 rounded-2xl border max-h-64 overflow-auto" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }}>{detail?.content || reviewing.content || '(no content)'}</pre>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>Feedback</label>
                  <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none" />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Daily Logs</p>
                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {(detail?.dailyLogs || []).map((log) => (
                      <div key={log.id} className="rounded-2xl border p-3" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{formatDate(log.date)} ? {log.hoursWorked}h</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{log.workDone}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Tech: {log.technologiesUsed || 'None'}</p>
                      </div>
                    ))}
                    {(detail?.dailyLogs || []).length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No daily logs were attached.</p>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Feedback History</p>
                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {(detail?.feedbackHistory || []).map((item) => (
                      <div key={item.id} className="rounded-2xl border p-3" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{ratingToStars(item.rating || 0)} {formatRating(item.rating || 0)}</p>
                          <Badge variant={reportBadgeVariant(item.status)}>{getReportStatusLabel(item.status)}</Badge>
                        </div>
                        {item.feedback && <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{item.feedback}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReports;
