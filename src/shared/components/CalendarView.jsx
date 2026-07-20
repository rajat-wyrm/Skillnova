// ════════════════════════════════════════════════════════════
//  CalendarView — month/week grid of meetings
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users, X, Plus, Loader2 } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, format,
  isSameMonth, isSameDay, parseISO,
} from 'date-fns';
import { Card } from './UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { useAuthStore } from '../../lib/auth';

const TYPE_COLORS = {
  STANDUP: '#00bea3', ONE_ON_ONE: '#ff6d34', REVIEW: '#7C3AED', TRAINING: '#2563EB', OTHER: '#94a3b8',
};

const CalendarView = () => {
  const { user } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = [];
  let d = gridStart;
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1); }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    api.get('/meetings', { params: { from: start.toISOString(), to: addDays(end, 1).toISOString() } })
      .then((r) => setMeetings(r.data.items))
      .catch(() => { })
      .finally(() => setLoading(false));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [currentMonth]);

  const meetingsByDay = useMemo(() => {
    const m = new Map();
    for (const meet of meetings) {
      const k = format(parseISO(meet.startsAt), 'yyyy-MM-dd');
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(meet);
    }
    return m;
  }, [meetings]);

  const selectedKey = format(selectedDay, 'yyyy-MM-dd');
  const dayMeetings = meetingsByDay.get(selectedKey) || [];

  const canEdit = ['SUPER_ADMIN', 'ADMIN', 'MENTOR'].includes(user?.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Meetings Calendar</h2>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#ff6d34' }}>
            <Plus size={15} /> Schedule meeting
          </button>
        )}
      </div>

      <Card className="p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text)' }}><ChevronLeft size={16} /></button>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{format(currentMonth, 'MMMM yyyy')}</h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text)' }}><ChevronRight size={16} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center font-semibold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1" style={{ minHeight: 360 }}>
          {days.map((day) => {
            const k = format(day, 'yyyy-MM-dd');
            const items = meetingsByDay.get(k) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDay);
            return (
              <button
                key={k}
                onClick={() => setSelectedDay(day)}
                className="p-1.5 rounded-lg text-left transition flex flex-col"
                style={{
                  background: isSelected ? 'rgba(255,109,52,0.1)' : isToday ? 'rgba(255,109,52,0.05)' : 'transparent',
                  border: `1px solid ${isSelected ? '#ff6d34' : 'var(--border)'}`,
                  minHeight: 70,
                  cursor: 'pointer',
                }}
              >
                <span className="text-xs font-semibold" style={{
                  color: !isCurrentMonth ? 'var(--muted)' : isToday ? '#ff6d34' : 'var(--text)',
                  opacity: !isCurrentMonth ? 0.4 : 1,
                }}>{format(day, 'd')}</span>
                <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                  {items.slice(0, 2).map((m) => (
                    <div key={m.id} className="text-[10px] truncate px-1.5 py-0.5 rounded" style={{ background: TYPE_COLORS[m.type] || '#94a3b8', color: '#fff' }}>
                      {format(parseISO(m.startsAt), 'HH:mm')} {m.title}
                    </div>
                  ))}
                  {items.length > 2 && <div className="text-[10px]" style={{ color: 'var(--muted)' }}>+{items.length - 2} more</div>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Calendar size={14} style={{ color: '#ff6d34' }} />
          {format(selectedDay, 'EEEE, MMMM d, yyyy')}
        </h3>
        {loading ? (
          <div className="py-6 text-center"><Loader2 size={18} className="animate-spin inline" style={{ color: 'var(--muted)' }} /></div>
        ) : dayMeetings.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>No meetings scheduled.</p>
        ) : (
          <div className="space-y-3">
            {dayMeetings.map((m) => (
              <div key={m.id} className="p-4 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-full rounded-full flex-shrink-0 self-stretch" style={{ background: TYPE_COLORS[m.type] || '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>{m.title}</p>
                    {m.description && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{m.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                      <span className="flex items-center gap-1"><Clock size={11} /> {format(parseISO(m.startsAt), 'HH:mm')}{m.endsAt && `–${format(parseISO(m.endsAt), 'HH:mm')}`}</span>
                      {m.location && <span className="flex items-center gap-1"><MapPin size={11} /> {m.location}</span>}
                      <span className="flex items-center gap-1"><Users size={11} /> {m.attendees?.length || 0} attendee{(m.attendees?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: TYPE_COLORS[m.type] || '#94a3b8', color: '#fff' }}>{m.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && <MeetingForm day={selectedDay} onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); setCurrentMonth(new Date(currentMonth)); }} />}
    </div>
  );
};

const MeetingForm = ({ day, onClose, onCreated }) => {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    title: '',
    description: '',
    startsAt: format(day, 'yyyy-MM-dd') + 'T10:00',
    endsAt: format(day, 'yyyy-MM-dd') + 'T11:00',
    location: '',
    type: 'ONE_ON_ONE',
  });
  const [users, setUsers] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users', { params: { limit: 100, role: 'INTERN' } })
      .then((r) => setUsers(r.data.items.filter((u) => u.id !== user.id)));
  }, [user.id]);

  const save = async () => {
    if (!form.title.trim()) return notify.error('Title is required');
    setSaving(true);
    try {
      await api.post('/meetings', { ...form, attendeeIds: attendees });
      notify.success('Meeting scheduled');
      onCreated();
    } catch (err) { notify.error(err.response?.data?.error || 'Failed'); }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, width: 'min(90vw, 560px)', maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Schedule meeting</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--muted)' }}><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Meeting title" className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2} placeholder="Description" className="w-full px-3 py-2.5 rounded-lg text-sm resize-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted)' }}>Start</label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted)' }}>End</label>
              <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted)' }}>Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Meet link or room" className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted)' }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                {Object.keys(TYPE_COLORS).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted)' }}>Attendees</label>
            <div className="max-h-32 overflow-y-auto p-2 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer text-sm">
                  <input type="checkbox" checked={attendees.includes(u.id)} onChange={(e) => setAttendees(e.target.checked ? [...attendees, u.id] : attendees.filter((x) => x !== u.id))} />
                  <span style={{ color: 'var(--text)' }}>{u.name}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>{u.department}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#ff6d34' }}>{saving ? 'Saving…' : 'Schedule'}</button>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
