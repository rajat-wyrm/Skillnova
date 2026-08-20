// ════════════════════════════════════════════════════════════
//  USER — pages/LeaveRequests.jsx
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { CalendarCheck, Loader2, Plus, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, SectionHeader, Badge, PrimaryButton, Input } from '../../shared/components/UI';
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
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [errors, setErrors] = useState({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/leave-requests', { params: { limit: 50 } });
      setRequests(data.items || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const validate = () => {
    const next = {};
    if (!form.startDate) next.startDate = 'Start date is required.';
    if (!form.endDate) next.endDate = 'End date is required.';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      next.endDate = 'End date cannot be before start date.';
    }
    if (!form.reason || form.reason.trim().length < 3) next.reason = 'Please provide a reason (min 3 characters).';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/leave-requests', form);
      notify.success('Leave request submitted successfully.');
      setForm({ startDate: '', endDate: '', reason: '' });
      setShowForm(false);
      setErrors({});
      fetchRequests();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not submit leave request.');
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
        subtitle="Request and track your leave applications"
        action={
          <PrimaryButton onClick={() => setShowForm((s) => !s)} icon={showForm ? X : Plus}>
            {showForm ? 'Cancel' : 'New Request'}
          </PrimaryButton>
        }
      />

      {showForm && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Submit Leave Request</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                error={errors.startDate}
              />
              <Input
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                error={errors.endDate}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                rows={3}
                className="w-full mt-1.5 p-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                placeholder="Please describe the reason for your leave..."
              />
              {errors.reason && <p className="text-xs text-red-500 font-medium mt-1">{errors.reason}</p>}
            </div>
            <div className="flex justify-end">
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Your Leave Requests</h3>
        </div>
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[40rem]">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Start Date', 'End Date', 'Reason', 'Status', 'Mentor Comment', 'Submitted'].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12" style={{ color: 'var(--muted)' }}>No leave requests yet.</td></tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>{formatDate(r.startDate)}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--text)' }}>{formatDate(r.endDate)}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{r.reason}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[r.status] || 'default'}>
                      {r.status === 'PENDING' ? <><Clock size={12} className="inline mr-1" />Pending</> : r.status === 'APPROVED' ? <><CheckCircle size={12} className="inline mr-1" />Approved</> : <><XCircle size={12} className="inline mr-1" />Rejected</>}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{r.reviewComment || '—'}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default LeaveRequests;
