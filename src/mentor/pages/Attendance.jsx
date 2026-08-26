// ════════════════════════════════════════════════════════════
//  MENTOR — pages/Attendance.jsx
//  Calendar view, detailed timeline (Start/End date, Days Left),
//  Present/Absent/Leave metrics, and 1-click attendance marking.
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Clock, AlertCircle, Loader2, Award, UserCheck, CalendarCheck, ShieldAlert
} from 'lucide-react';
import { Card, SectionHeader, Badge, Modal } from '../../shared/components/UI';
import api, { getErrorMessage } from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';

const STATUS_CONFIG = {
  PRESENT: { label: 'Present', color: '#00bea3', bg: 'rgba(0,190,163,0.1)', border: '#00bea3' },
  ABSENT:  { label: 'Absent',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)', border: '#dc2626' },
  LEAVE:   { label: 'Leave',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: '#f59e0b' },
  HALF_DAY:{ label: 'Half Day',color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: '#8b5cf6' },
  LATE:    { label: 'Late',    color: '#ec4899', bg: 'rgba(236,72,153,0.1)', border: '#ec4899' },
};

const Attendance = () => {
  const [filterTab, setFilterTab] = useState('my'); // 'my' vs 'all'
  const [interns, setInterns] = useState([]);
  const [selectedInternId, setSelectedInternId] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingDate, setMarkingDate] = useState(null);
  const [markStatus, setMarkStatus] = useState('PRESENT');
  const [markNotes, setMarkNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch interns (assigned vs all)
  const fetchInterns = async () => {
    try {
      const { data } = await api.get('/users', {
        params: { role: 'INTERN', myInterns: filterTab === 'my', limit: 200 },
      });
      const items = data.items || [];
      setInterns(items);
      if (items.length > 0 && (!selectedInternId || !items.some((i) => i.id === selectedInternId))) {
        setSelectedInternId(items[0].id);
      }
    } catch (err) {
      notify.error(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchInterns();
  }, [filterTab]);

  // 2. Fetch attendance records for selected intern
  const fetchAttendance = async () => {
    if (!selectedInternId) return;
    setLoading(true);
    try {
      const { data } = await api.get('/attendance', {
        params: { userId: selectedInternId, limit: 100 },
      });
      setAttendanceRecords(data.items || []);
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedInternId]);

  // Selected Intern Object
  const selectedIntern = useMemo(() => {
    return interns.find((i) => i.id === selectedInternId) || null;
  }, [interns, selectedInternId]);

  // Internship timeline calculations (90 Days Total Duration)
  const timeline = useMemo(() => {
    const start = selectedIntern?.createdAt ? new Date(selectedIntern.createdAt) : new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + 90);

    const now = new Date();
    const totalDays = 90;
    const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((now - start) / (1000 * 60 * 60 * 24))));
    const daysLeft = Math.max(0, totalDays - elapsedDays);

    return {
      startDate: start,
      endDate: end,
      totalDays,
      elapsedDays,
      daysLeft,
    };
  }, [selectedIntern]);

  // Attendance Statistics
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let halfDay = 0;
    let late = 0;

    const map = {};
    attendanceRecords.forEach((rec) => {
      const key = new Date(rec.date).toISOString().slice(0, 10);
      map[key] = rec;
      if (rec.status === 'PRESENT') present++;
      else if (rec.status === 'ABSENT') absent++;
      else if (rec.status === 'LEAVE') leave++;
      else if (rec.status === 'HALF_DAY') halfDay++;
      else if (rec.status === 'LATE') late++;
    });

    const totalMarked = attendanceRecords.length;
    const effectivePresent = present + halfDay * 0.5 + late;
    const rate = totalMarked > 0 ? Math.round((effectivePresent / totalMarked) * 100) : 100;

    return { present, absent, leave, halfDay, late, totalMarked, rate, map };
  }, [attendanceRecords]);

  // Month Calendar Days Grid
  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startOffset = firstDay.getDay(); // 0 = Sun

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Next month padding to fill grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let i = days.length; i < totalCells; i++) {
      const d = new Date(year, month + 1, i - days.length + 1);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  // Mark Attendance Handler
  const handleSaveAttendance = async () => {
    if (!selectedInternId || !markingDate) return;
    setSubmitting(true);
    try {
      await api.post('/attendance/mark', {
        userId: selectedInternId,
        date: markingDate,
        status: markStatus,
        notes: markNotes.trim() || undefined,
      });
      notify.success(`Marked ${markStatus} for ${formatDate(markingDate)}`);
      setMarkingDate(null);
      setMarkNotes('');
      fetchAttendance();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const markTodayQuick = async (status) => {
    if (!selectedInternId) return;
    try {
      await api.post('/attendance/mark', {
        userId: selectedInternId,
        date: new Date(),
        status,
      });
      notify.success(`Today marked as ${status}`);
      fetchAttendance();
    } catch (err) {
      notify.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Intern Attendance & Timeline"
        subtitle="Track daily attendance, view internship duration timeline, and mark attendance for assigned interns."
        action={
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => markTodayQuick('PRESENT')}
              className="px-3.5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
              style={{ background: '#00bea3' }}
            >
              <CheckCircle size={14} /> Mark Present Today
            </button>
            <button
              onClick={() => markTodayQuick('ABSENT')}
              className="px-3.5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
              style={{ background: '#dc2626' }}
            >
              <XCircle size={14} /> Mark Absent Today
            </button>
          </div>
        }
      />

      {/* Filter Tabs (My Interns vs All Platform Interns) */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setFilterTab('my')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            filterTab === 'my'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          My Assigned Interns
        </button>
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            filterTab === 'all'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Platform Interns
        </button>
      </div>

      {/* Intern Selector Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCheck className="text-purple-600" size={22} />
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Select Intern to View Stats & Calendar:
              </label>
              <select
                value={selectedInternId}
                onChange={(e) => setSelectedInternId(e.target.value)}
                className="mt-1 px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
              >
                {interns.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.email}) — {i.department || 'No Dept'}
                  </option>
                ))}
                {interns.length === 0 && <option value="">No interns found</option>}
              </select>
            </div>
          </div>

          {selectedIntern && (
            <div className="flex items-center gap-4 text-xs">
              <div className="bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-xl text-purple-700 dark:text-purple-300">
                <span className="font-semibold block">Department</span>
                <span className="font-bold text-sm">{selectedIntern.department || 'General'}</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/30 px-3 py-2 rounded-xl text-amber-700 dark:text-amber-300">
                <span className="font-semibold block">Rating</span>
                <span className="font-bold text-sm">⭐ {selectedIntern.rating?.toFixed?.(1) ?? selectedIntern.rating ?? 0}/10</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center border-l-4" style={{ borderLeftColor: '#00bea3' }}>
          <span className="text-xs font-semibold text-slate-500 block">Present Days</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{stats.present}</span>
        </Card>
        <Card className="p-4 text-center border-l-4" style={{ borderLeftColor: '#dc2626' }}>
          <span className="text-xs font-semibold text-slate-500 block">Absent Days</span>
          <span className="text-2xl font-bold text-red-600 mt-1 block">{stats.absent}</span>
        </Card>
        <Card className="p-4 text-center border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
          <span className="text-xs font-semibold text-slate-500 block">Leaves Taken</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">{stats.leave}</span>
        </Card>
        <Card className="p-4 text-center border-l-4" style={{ borderLeftColor: '#8b5cf6' }}>
          <span className="text-xs font-semibold text-slate-500 block">Attendance Rate</span>
          <span className="text-2xl font-bold text-purple-600 mt-1 block">{stats.rate}%</span>
        </Card>
        <Card className="p-4 text-center border-l-4" style={{ borderLeftColor: '#2563eb' }}>
          <span className="text-xs font-semibold text-slate-500 block">Days Elapsed</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">{timeline.elapsedDays}</span>
        </Card>
        <Card className="p-4 text-center border-l-4" style={{ borderLeftColor: '#ec4899' }}>
          <span className="text-xs font-semibold text-slate-500 block">Days Left</span>
          <span className="text-2xl font-bold text-pink-600 mt-1 block">{timeline.daysLeft}</span>
        </Card>
      </div>

      {/* Internship Timeline Details Card */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarCheck size={16} className="text-purple-600" /> Internship Timeline Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Start date, estimated end date, and duration progress</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800">
              Start: {formatDate(timeline.startDate)}
            </span>
            <span className="px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-800">
              End: {formatDate(timeline.endDate)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>Progress: {timeline.elapsedDays} of {timeline.totalDays} Days Completed</span>
            <span>{Math.round((timeline.elapsedDays / timeline.totalDays) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((timeline.elapsedDays / timeline.totalDays) * 100))}%`,
                background: 'linear-gradient(90deg, #7C3AED, #2563EB)',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Calendar Grid View */}
      <Card className="p-5">
        {/* Calendar Header Controls */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
            </button>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 min-w-[140px] text-center">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {/* Day Header Row */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-1.5">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-purple-600" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {calendarGrid.map(({ date, isCurrentMonth }, idx) => {
              const key = date.toISOString().slice(0, 10);
              const record = stats.map[key];
              const isToday = key === new Date().toISOString().slice(0, 10);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setMarkingDate(date);
                    setMarkStatus(record?.status || 'PRESENT');
                    setMarkNotes(record?.notes || '');
                  }}
                  className={`min-h-[72px] p-2 rounded-xl border text-left flex flex-col justify-between transition relative hover:scale-[1.02] ${
                    isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-900/30 opacity-40'
                  }`}
                  style={{
                    borderColor: isToday ? '#7C3AED' : 'var(--border)',
                    borderWidth: isToday ? '2px' : '1px',
                  }}
                >
                  <span className={`text-xs font-bold ${isToday ? 'text-purple-600' : 'text-slate-600 dark:text-slate-300'}`}>
                    {date.getDate()}
                  </span>

                  {record ? (
                    <span
                      className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-center truncate block"
                      style={{
                        background: STATUS_CONFIG[record.status]?.bg || '#eee',
                        color: STATUS_CONFIG[record.status]?.color || '#333',
                      }}
                    >
                      {STATUS_CONFIG[record.status]?.label || record.status}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300 dark:text-slate-600 font-normal">Click to mark</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Mark / Edit Attendance Modal */}
      <Modal
        isOpen={!!markingDate}
        onClose={() => setMarkingDate(null)}
        title={`Mark Attendance — ${markingDate ? formatDate(markingDate) : ''}`}
        footer={
          <>
            <button onClick={() => setMarkingDate(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
              Cancel
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition flex items-center gap-2"
            >
              {submitting && <Loader2 className="animate-spin" size={14} />} Save Attendance
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Attendance Status:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMarkStatus(key)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                    markStatus === key ? 'ring-2 ring-purple-600 shadow-sm' : ''
                  }`}
                  style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Notes / Feedback (Optional):
            </label>
            <textarea
              rows={3}
              value={markNotes}
              onChange={(e) => setMarkNotes(e.target.value)}
              placeholder="e.g. Approved leave request for exam, or attended morning standup late."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;
