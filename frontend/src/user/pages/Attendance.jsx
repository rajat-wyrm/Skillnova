// ════════════════════════════════════════════════════════════
//  USER — pages/Attendance.jsx (API-driven, self check-in)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle, XCircle, Clock, Loader2, Save } from 'lucide-react';
import { Card, StatCard, SectionHeader, Badge } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';

const STATUS_VARIANT = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LEAVE: 'warning',
  HALF_DAY: 'warning',
  LATE: 'warning',
};

const Attendance = () => {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        api.get('/attendance/summary'),
        api.get('/attendance', { params: { limit: 30 } }),
      ]);
      setSummary(s.data);
      setRecords(r.data.items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const checkIn = async (status) => {
    setSubmitting(true);
    try {
      await api.post('/attendance/check', { status });
      notify.success(`Marked ${status.toLowerCase()} for today.`);
      fetch();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not mark attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Attendance" subtitle="Track your daily attendance and check in" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Present (30d)" value={summary?.present ?? 0} icon={CheckCircle} color="#00bea3" />
        <StatCard title="Absent (30d)" value={summary?.absent ?? 0} icon={XCircle} color="#dc2626" />
        <StatCard title="On Leave" value={summary?.leave ?? 0} icon={Clock} color="#f59e0b" />
        <StatCard title="Attendance Rate" value={`${summary?.rate ?? 0}%`} icon={CalendarCheck} color="#ff6d34" />
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Mark today</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => checkIn('PRESENT')} disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: '#00bea3' }}>
            <CheckCircle size={14} /> Check in as Present
          </button>
          <button onClick={() => checkIn('LEAVE')} disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: '#f59e0b' }}>
            <Clock size={14} /> Request Leave
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Recent records</h3>
        </div>
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[40rem]">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Status', 'Check-in', 'Check-out', 'Notes'].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12" style={{ color: 'var(--muted)' }}>No attendance records yet.</td></tr>
              )}
              {records.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>{formatDate(r.date)}</td>
                  <td className="px-5 py-4"><Badge variant={STATUS_VARIANT[r.status]}>{r.status.replace('_', ' ')}</Badge></td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Attendance;
