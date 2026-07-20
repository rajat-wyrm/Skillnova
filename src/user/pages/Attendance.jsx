import { useEffect, useState } from 'react';
import { CalendarCheck, Loader2, LogIn, LogOut, Send } from 'lucide-react';
import { Badge, Card, SectionHeader, GreenButton, PrimaryButton } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';

const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Personal Leave'];

const statusVariant = (label) => {
  if (label === 'Checked Out' || label === 'Present') return 'success';
  if (label === 'Checked In') return 'warning';
  if (label === 'Leave') return 'purple';
  return 'gray';
};

const leaveVariant = (status) => {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
};

const Attendance = () => {
  const [today, setToday] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [leaveForm, setLeaveForm] = useState({
    leaveType: LEAVE_TYPES[0],
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [todayRes, summaryRes, attendanceRes, leaveRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/summary'),
        api.get('/attendance', { params: { limit: 10 } }),
        api.get('/leave-requests', { params: { limit: 20 } }),
      ]);
      setToday(todayRes.data);
      setSummary(summaryRes.data);
      setRecords(attendanceRes.data.items);
      setLeaveRequests(leaveRes.data.items);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to load attendance details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAttendanceAction = async (action) => {
    setBusyAction(action);
    try {
      await api.post('/attendance/check', { action });
      notify.success(action === 'CHECK_IN' ? 'Checked in successfully.' : 'Checked out successfully.');
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to update attendance.');
    } finally {
      setBusyAction('');
    }
  };

  const submitLeaveRequest = async () => {
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      notify.error('Please fill all required fields.');
      return;
    }

    setBusyAction('LEAVE_REQUEST');
    try {
      await api.post('/leave-requests', {
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason.trim(),
      });
      notify.success('Leave request submitted.');
      setLeaveForm({
        leaveType: LEAVE_TYPES[0],
        startDate: '',
        endDate: '',
        reason: '',
      });
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to submit leave request.');
    } finally {
      setBusyAction('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  const quickSummary = [
    { label: 'Present Days', value: summary?.presentDays ?? 0, color: '#00bea3', bg: 'rgba(0,190,163,0.12)' },
    { label: 'Absent Days', value: summary?.absentDays ?? 0, color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
    { label: 'Leave Days', value: summary?.leaveDays ?? 0, color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
    { label: 'Working Days', value: summary?.totalWorkingDays ?? 0, color: '#ff6d34', bg: 'rgba(255,109,52,0.12)' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <SectionHeader
        title="Attendance"
        subtitle="Track today's attendance, leave requests and your attendance report"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Today&apos;s Attendance Status
              </p>
              <Badge variant={statusVariant(today?.label)}>{today?.label ?? 'Not Checked In'}</Badge>
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                    Check In Time
                  </p>
                  <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                    {today?.attendance?.checkIn ? formatDate(today.attendance.checkIn, 'hh:mm a') : '--'}
                  </p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                    Check Out Time
                  </p>
                  <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                    {today?.attendance?.checkOut ? formatDate(today.attendance.checkOut, 'hh:mm a') : '--'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <PrimaryButton
                onClick={() => handleAttendanceAction('CHECK_IN')}
                icon={LogIn}
                className={!today?.canCheckIn || busyAction ? 'opacity-60 pointer-events-none' : ''}
              >
                {busyAction === 'CHECK_IN' ? 'Checking In...' : 'Check In'}
              </PrimaryButton>
              <GreenButton
                onClick={() => handleAttendanceAction('CHECK_OUT')}
                icon={LogOut}
                className={!today?.canCheckOut || busyAction ? 'opacity-60 pointer-events-none' : ''}
              >
                {busyAction === 'CHECK_OUT' ? 'Checking Out...' : 'Check Out'}
              </GreenButton>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,109,52,0.12)' }}>
              <CalendarCheck size={20} style={{ color: '#ff6d34' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Attendance Percentage
              </p>
              <p className="text-4xl font-black mt-1" style={{ color: 'var(--text)' }}>
                {summary?.attendancePercentage ?? 0}%
              </p>
            </div>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${summary?.attendancePercentage ?? 0}%`,
                background: 'linear-gradient(90deg, #ff6d34, #00bea3)',
              }}
            />
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
            Based on your recent attendance records.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickSummary.map((item) => (
          <div key={item.label} className="rounded-2xl p-4" style={{ background: item.bg }}>
            <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: 'var(--muted)' }}>{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.35fr] gap-4">
        <Card className="p-5">
          <SectionHeader title="Leave Application" subtitle="Submit a simple leave request" />
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--muted)' }}>
                Leave Type
              </label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none"
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--muted)' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--muted)' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--muted)' }}>
                Reason
              </label>
              <textarea
                rows={4}
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="Enter your reason"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none resize-none"
              />
            </div>

            <GreenButton onClick={submitLeaveRequest} icon={Send} className={busyAction ? 'opacity-60 pointer-events-none' : ''}>
              {busyAction === 'LEAVE_REQUEST' ? 'Submitting...' : 'Submit Leave Request'}
            </GreenButton>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <SectionHeader title="Leave History" subtitle="Your previous leave requests" />
          </div>
          <div className="sn-table-scroll">
            <table className="w-full text-sm min-w-[36rem]">
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  {['Leave Type', 'From', 'To', 'Status'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>{request.leaveType}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--muted)' }}>{formatDate(request.startDate)}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--muted)' }}>{formatDate(request.endDate)}</td>
                    <td className="px-5 py-4"><Badge variant={leaveVariant(request.status)}>{request.status}</Badge></td>
                  </tr>
                ))}
                {leaveRequests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>
                      No leave requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <SectionHeader title="Attendance Report" subtitle="Quick report of your attendance activity" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-5">
          {[
            { label: 'Total Working Days', value: summary?.totalWorkingDays ?? 0 },
            { label: 'Present Days', value: summary?.presentDays ?? 0 },
            { label: 'Absent Days', value: summary?.absentDays ?? 0 },
            { label: 'Leave Days', value: summary?.leaveDays ?? 0 },
            { label: 'Attendance Percentage', value: `${summary?.attendancePercentage ?? 0}%` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{item.label}</p>
              <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text)' }}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="sn-table-scroll border-t" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm min-w-[42rem]">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Status', 'Check In', 'Check Out'].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>{formatDate(record.date)}</td>
                  <td className="px-5 py-4">
                    <Badge variant={record.status === 'PRESENT' ? 'success' : record.status === 'LEAVE' ? 'purple' : 'warning'}>
                      {record.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4" style={{ color: 'var(--muted)' }}>
                    {record.checkIn ? formatDate(record.checkIn, 'hh:mm a') : '--'}
                  </td>
                  <td className="px-5 py-4" style={{ color: 'var(--muted)' }}>
                    {record.checkOut ? formatDate(record.checkOut, 'hh:mm a') : '--'}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>
                    No attendance records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Attendance;
