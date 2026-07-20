// ════════════════════════════════════════════════════════════
//  Mentor — Feedback page
//  Submit rating / completion status / comments for an intern
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Loader2, Star, Award, Download } from 'lucide-react';
import { Card, SectionHeader, PrimaryButton, Badge } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';

const STATUS_OPTIONS = ['IN_PROGRESS', 'COMPLETED', 'TERMINATED'];

const Feedback = () => {
  const [interns, setInterns] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [internId, setInternId] = useState('');
  const [rating, setRating] = useState(5);
  const [completionStatus, setCompletionStatus] = useState('IN_PROGRESS');
  const [comments, setComments] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [internsRes, feedbackRes] = await Promise.all([
        api.get('/users', { params: { role: 'INTERN', limit: 100 } }),
        api.get('/feedback', { params: { limit: 50 } }),
      ]);
      setInterns(internsRes.data.items);
      setHistory(feedbackRes.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const submitFeedback = async () => {
    if (!internId) {
      notify.error('Please select an intern first.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/feedback', {
        internId,
        rating,
        completionStatus,
        comments: comments || undefined,
      });
      notify.success('Feedback submitted.');
      setInternId(''); setRating(5); setCompletionStatus('IN_PROGRESS'); setComments('');
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const generateCertificate = async (feedbackId) => {
    try {
      await api.post('/certificates/generate', {
        feedbackId,
        startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
        endDate: new Date().toISOString(),
      });
      notify.success('Certificate generated.');
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not generate certificate.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Mentor Feedback" subtitle="Rate and review your interns' progress" />

      {/* New feedback form */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Submit New Feedback</h3>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Intern</label>
          <select
            value={internId}
            onChange={(e) => setInternId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <option value="">Select an intern…</option>
            {interns.map((i) => (
              <option key={i.id} value={i.id}>{i.name} — {i.email}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star
                  size={22}
                  fill={n <= rating ? '#f59e0b' : 'none'}
                  style={{ color: n <= rating ? '#f59e0b' : 'var(--muted)' }}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Completion Status</label>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setCompletionStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${completionStatus === s
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Comments</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            placeholder="Optional notes about performance…"
            className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
          />
        </div>

        <PrimaryButton onClick={submitFeedback} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </PrimaryButton>
      </Card>

      {/* Feedback history */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Feedback History</h3>
        {history.length === 0 && (
          <Card className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
            No feedback submitted yet.
          </Card>
        )}
        {history.map((f) => (
          <Card key={f.id} className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <div className="font-medium" style={{ color: 'var(--text)' }}>{f.intern?.name}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(f.createdAt)}</div>
                {f.comments && <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>{f.comments}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                  ⭐ {f.rating}/5
                </span>
                <Badge variant={f.completionStatus === 'COMPLETED' ? 'success' : 'default'}>
                  {f.completionStatus.replace('_', ' ')}
                </Badge>
                {f.completionStatus === 'COMPLETED' && !f.certificate && (
                  <button
                    onClick={() => generateCertificate(f.id)}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-purple-600 text-white"
                  >
                    <Award size={14} /> Generate Certificate
                  </button>
                )}
                {f.certificate && f.certificate.fileAsset && (
                  <a
                    href={`/api/v1/files/${f.certificate.fileAsset.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-600 text-white"
                  >
                    <Download size={14} /> Download
                  </a>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div >
  );
};

export default Feedback;
