// ════════════════════════════════════════════════════════════
//  MENTOR — pages/LeaveRequests.jsx
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { Card, SectionHeader, Badge, PrimaryButton, GreenButton, Modal } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';

const STATUS_VARIANT = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [actionId, setActionId] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/leave-requests', { params: { limit: 50, status: filter === 'ALL' ? undefined : filter } });
      setRequests(data.items || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const submitAction = async (status) => {
    if (!actionId) return;
    setSubmitting(true);
    try {
      await api.patch(`/leave-requests/${actionId}/status`, { status, comment });
      notify.success(`Leave request ${status.toLowerCase()} successfully.`);
      setActionId(null);
      setComment('');
      fetchRequests();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not update leave request.');
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
        title="Leave Requests"
        subtitle="Review and manage leave requests from your interns"
      />

      <div className="flex items-center gap-2">
        <Filter size={14} style={{ color: 'var(--muted)' }} />
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === s ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            {s === 'ALL' ? 'All' : s}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[48rem]">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Intern', 'Start Date', 'End Date', 'Reason', 'Status', 'Mentor Comment', 'Submitted', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12" style={{ color: 'var(--muted)' }}>No leave requests found.</td></tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}>
                        {(r.intern?.name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.intern?.name || 'Unknown'}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{r.intern?.department || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text)' }}>{formatDate(r.startDate)}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text)' }}>{formatDate(r.endDate)}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{r.reason}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[r.status] || 'default'}>
                      {r.status === 'PENDING' ? <><Clock size={12} className="inline mr-1" />Pending</> : r.status === 'APPROVED' ? <><CheckCircle size={12} className="inline mr-1" />Approved</> : <><XCircle size={12} className="inline mr-1" />Rejected</>}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{r.reviewComment || '—'}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{formatDate(r.createdAt)}</td>
                  <td className="px-5 py-4">
                    {r.status === 'PENDING' ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setActionId(r.id); setComment(''); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
                          style={{ background: '#00bea3' }}
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          onClick={() => { setActionId(r.id); setComment(''); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
                          style={{ background: '#dc2626' }}
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={!!actionId}
        onClose={() => { setActionId(null); setComment(''); }}
        title="Review Leave Request"
        footer={
          <div className="flex gap-3">
            <GreenButton onClick={() => submitAction('APPROVED')} disabled={submitting}>
              {submitting ? 'Saving...' : 'Approve'}
            </GreenButton>
            <PrimaryButton onClick={() => submitAction('REJECTED')} disabled={submitting}>
              {submitting ? 'Saving...' : 'Reject'}
            </PrimaryButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full mt-1.5 p-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              placeholder="Add a comment for the intern..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveRequests;
