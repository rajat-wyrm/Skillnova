// ════════════════════════════════════════════════════════════
//  USER — pages/Reports.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Search, FileText, Upload, Loader2 } from 'lucide-react';
import { Card, Badge, SectionHeader, Input, GreenButton, Modal } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';
import { getSocket } from '../../lib/socket';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', weekNumber: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports', { params: { limit: 50 } });
      setReports(data.items);
    } catch {
      notify.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onReviewed = (data) => {
      setReports((arr) => arr.map((r) => (r.id === data.reportId ? { ...r, status: data.status } : r)));
      notify.info(`Your report was ${data.status.toLowerCase()}`);
    };
    const onRefresh = () => { fetch(); };
    socket.on('report:reviewed', onReviewed);
    socket.on('dashboard:refresh', onRefresh);
    return () => {
      socket.off('report:reviewed', onReviewed);
      socket.off('dashboard:refresh', onRefresh);
    };
  }, []);

  const filtered = reports.filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  );

  const submit = async () => {
    if (!form.title.trim()) {
      notify.error('Please add a title.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reports', {
        title: form.title.trim(),
        content: form.content.trim() || undefined,
        weekNumber: form.weekNumber ? Number(form.weekNumber) : undefined,
      });
      notify.success('Report submitted!');
      setIsModalOpen(false);
      setForm({ title: '', content: '', weekNumber: '' });
      fetch();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Reports"
        subtitle="View and manage your weekly progress reports"
        action={
          <button onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition"
            style={{ background: '#ff6d34' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e85d25')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ff6d34')}>
            <Upload size={15} /> Submit Report
          </button>
        }
      />

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reports…"
          className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition" />
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} hover className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-3 rounded-xl flex-shrink-0"
                  style={{ background: r.status === 'REVIEWED' ? 'rgba(0,190,163,0.15)' : r.status === 'REJECTED' ? 'rgba(220,38,38,0.15)' : 'rgba(255,109,52,0.15)' }}>
                  <FileText size={20}
                    style={{ color: r.status === 'REVIEWED' ? '#00bea3' : r.status === 'REJECTED' ? '#dc2626' : '#ff6d34' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white break-words">{r.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Week {r.weekNumber ?? '—'} · Submitted {formatDate(r.submittedAt)}</p>
                  {r.feedback && <p className="text-xs mt-1 italic" style={{ color: 'var(--muted)' }}>“{r.feedback}”</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0 sm:justify-end">
                <Badge variant={r.status === 'REVIEWED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'}>
                  {r.status}
                </Badge>
                {r.score != null && (
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.score}/10</span>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>No reports found.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Progress Report"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
            <GreenButton onClick={submit}>{submitting ? 'Submitting…' : 'Submit Report'}</GreenButton>
          </>
        }>
        <div className="space-y-4">
          <Input label="Report Title" placeholder="e.g. Week 4 Progress Report" icon={FileText}
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Week number" type="number" min={1} max={52} placeholder="e.g. 4"
            value={form.weekNumber} onChange={(e) => setForm({ ...form, weekNumber: e.target.value })} />
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8} placeholder="Goals · Completed · Blockers · Learnings · Next steps"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition font-sans" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
