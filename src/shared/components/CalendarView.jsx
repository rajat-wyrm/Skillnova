// ════════════════════════════════════════════════════════════
//  CalendarView — month/week grid of meetings
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users, X, Plus, Loader2, Sparkles, Check, FileText } from 'lucide-react';
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

  // AI Meeting Minutes States
  const [interns, setInterns] = useState([]);
  const [expandedMinutesId, setExpandedMinutesId] = useState(null);
  const [activeTab, setActiveTab] = useState('transcript');
  const [transcriptText, setTranscriptText] = useState('');
  const [minutesSummary, setMinutesSummary] = useState('');
  const [minutesDecisions, setMinutesDecisions] = useState('');
  const [minutesTasks, setMinutesTasks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    api.get('/users', { params: { limit: 100, role: 'INTERN' } })
      .then((r) => setInterns(r.data.items))
      .catch(() => {});
  }, []);

  const handleOpenMinutes = (m) => {
    setExpandedMinutesId(m.id === expandedMinutesId ? null : m.id);
    setTranscriptText(m.minutesRawTranscript || '');
    setMinutesSummary(m.minutesSummary || '');
    setMinutesDecisions(m.minutesDecisions || '');
    setMinutesTasks(m.minutesTasks || []);
    setActiveTab(m.minutesSummary ? 'results' : 'transcript');
  };

  const handleGenerateMinutes = async (meetingId) => {
    if (!transcriptText.trim()) return notify.error('Please enter notes or a transcript.');
    setGenerating(true);
    try {
      const res = await api.post(`/meetings/${meetingId}/minutes`, { transcript: transcriptText });
      setMinutesSummary(res.data.summary);
      setMinutesDecisions(res.data.decisions);
      setMinutesTasks(res.data.tasks || []);
      
      // Update local meeting object in state
      setMeetings(prev => prev.map(m => m.id === meetingId ? {
        ...m,
        minutesRawTranscript: transcriptText,
        minutesSummary: res.data.summary,
        minutesDecisions: res.data.decisions,
        minutesTasks: res.data.tasks
      } : m));

      notify.success('AI Meeting Minutes generated successfully!');
      setActiveTab('results');
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to extract minutes.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleSelectTask = (idx, selected) => {
    setMinutesTasks(prev => prev.map((t, i) => i === idx ? { ...t, selected } : t));
  };

  const handleTaskPropChange = (idx, prop, val) => {
    setMinutesTasks(prev => prev.map((t, i) => i === idx ? { ...t, [prop]: val } : t));
  };

  const handleSyncTasks = async (meetingId) => {
    const tasksToSync = minutesTasks.filter(t => t.selected !== false && !t.synced);
    if (tasksToSync.length === 0) return notify.error('No tasks selected to sync.');
    
    setSyncing(true);
    try {
      await api.post(`/meetings/${meetingId}/minutes/sync`, { tasks: tasksToSync });
      
      // Mark as synced locally
      const updatedTasks = minutesTasks.map(t => 
        tasksToSync.some(tts => tts.title === t.title) ? { ...t, synced: true } : t
      );
      setMinutesTasks(updatedTasks);
      
      // Update local meeting object in state
      setMeetings(prev => prev.map(m => m.id === meetingId ? {
        ...m,
        minutesTasks: updatedTasks
      } : m));

      notify.success('Action items successfully synced to task board!');
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to sync tasks.');
    } finally {
      setSyncing(false);
    }
  };

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
    api.get('/meetings', { params: { from: monthStart.toISOString(), to: addDays(monthEnd, 1).toISOString() } })
      .then((r) => setMeetings(r.data.items))
      .catch(() => {})
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
              <div key={m.id} className="p-4 rounded-xl flex flex-col" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
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
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: TYPE_COLORS[m.type] || '#94a3b8', color: '#fff' }}>{m.type}</span>
                    <button
                      onClick={() => handleOpenMinutes(m)}
                      className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition hover:scale-[1.03] select-none"
                      style={{
                        background: expandedMinutesId === m.id ? '#ff6d34' : 'rgba(255,109,52,0.1)',
                        color: expandedMinutesId === m.id ? '#fff' : '#ff6d34',
                        border: '1px solid #ff6d34',
                        cursor: 'pointer'
                      }}
                    >
                      <Sparkles size={10} /> AI Minutes
                    </button>
                  </div>
                </div>

                {expandedMinutesId === m.id && (
                  <div className="mt-4 pt-4 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: '#ff6d34' }}>
                        <Sparkles size={12} /> AI Meeting Minutes & Task Sync
                      </h4>
                      <button 
                        onClick={() => setExpandedMinutesId(null)}
                        className="text-xs font-medium px-2 py-1 rounded-lg" 
                        style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-soft)', cursor: 'pointer' }}
                      >
                        Close
                      </button>
                    </div>

                    {/* Tab Selectors */}
                    <div className="flex gap-2 mb-3">
                      <button 
                        onClick={() => setActiveTab('transcript')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                          background: activeTab === 'transcript' ? '#ff6d34' : 'var(--bg-soft)',
                          color: activeTab === 'transcript' ? '#white' : 'var(--text-soft)',
                          cursor: 'pointer'
                        }}
                      >
                        1. Notes & Transcript
                      </button>
                      <button 
                        onClick={() => {
                          if (minutesSummary || minutesTasks.length > 0) {
                            setActiveTab('results');
                          }
                        }}
                        disabled={!minutesSummary && minutesTasks.length === 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                        style={{
                          background: activeTab === 'results' ? '#ff6d34' : 'var(--bg-soft)',
                          color: activeTab === 'results' ? '#white' : 'var(--text-soft)',
                          cursor: (!minutesSummary && minutesTasks.length === 0) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        2. AI Extraction
                      </button>
                    </div>

                    {activeTab === 'transcript' ? (
                      <div className="space-y-3">
                        <textarea
                          value={transcriptText}
                          onChange={(e) => setTranscriptText(e.target.value)}
                          placeholder="Paste the meeting raw transcript here or enter summary notes. (e.g. 'Rahul to write API documentation. Sneha will refactor auth and deploy to staging next week. Priority is high.')"
                          rows={5}
                          className="w-full p-3 rounded-lg text-xs"
                          style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', resize: 'none' }}
                        />
                        <button
                          onClick={() => handleGenerateMinutes(m.id)}
                          disabled={generating || transcriptText.trim().length < 10}
                          className="w-full py-2.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                          style={{ background: '#ff6d34', cursor: (generating || transcriptText.trim().length < 10) ? 'not-allowed' : 'pointer' }}
                        >
                          {generating ? (
                            <>
                              <Loader2 size={13} className="animate-spin" /> Extracting AI Minutes...
                            </>
                          ) : (
                            <>
                              <Sparkles size={13} /> Extract Summary & Tasks
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Summary & Decisions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
                            <p className="font-bold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text)' }}><FileText size={12} /> Discussion Summary</p>
                            <div className="whitespace-pre-line text-xs" style={{ color: 'var(--text-soft)' }}>
                              {minutesSummary || 'No summary generated.'}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
                            <p className="font-bold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text)' }}><Check size={12} /> Decisions Made</p>
                            <div className="whitespace-pre-line text-xs" style={{ color: 'var(--text-soft)' }}>
                              {minutesDecisions || 'No decisions recorded.'}
                            </div>
                          </div>
                        </div>

                        {/* Action Items List */}
                        <div className="space-y-2">
                          <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>Action Items / Tasks to Sync:</p>
                          {minutesTasks.length === 0 ? (
                            <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>No action items extracted.</p>
                          ) : (
                            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                              {minutesTasks.map((t, idx) => (
                                <div key={idx} className="p-3 rounded-lg border flex flex-col gap-2 relative" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{t.title}</p>
                                      {t.description && <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{t.description}</p>}
                                    </div>
                                    {t.synced ? (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,190,163,0.15)', color: '#00bea3' }}>Synced</span>
                                    ) : (
                                      <input 
                                        type="checkbox" 
                                        checked={t.selected !== false} 
                                        onChange={(e) => handleToggleSelectTask(idx, e.target.checked)} 
                                        className="rounded cursor-pointer"
                                      />
                                    )}
                                  </div>

                                  {!t.synced && (
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                      {/* Assignee */}
                                      <div>
                                        <label className="text-[9px] font-bold block mb-0.5" style={{ color: 'var(--muted)' }}>Assignee</label>
                                        <select
                                          value={t.assigneeId || ''}
                                          onChange={(e) => handleTaskPropChange(idx, 'assigneeId', e.target.value)}
                                          className="w-full p-1 rounded border text-[10px]"
                                          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                                        >
                                          <option value="">Unassigned</option>
                                          {interns.map(i => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Priority */}
                                      <div>
                                        <label className="text-[9px] font-bold block mb-0.5" style={{ color: 'var(--muted)' }}>Priority</label>
                                        <select
                                          value={t.priority}
                                          onChange={(e) => handleTaskPropChange(idx, 'priority', e.target.value)}
                                          className="w-full p-1 rounded border text-[10px]"
                                          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                                        >
                                          <option value="LOW">Low</option>
                                          <option value="MEDIUM">Medium</option>
                                          <option value="HIGH">High</option>
                                          <option value="URGENT">Urgent</option>
                                        </select>
                                      </div>

                                      {/* Due Date */}
                                      <div>
                                        <label className="text-[9px] font-bold block mb-0.5" style={{ color: 'var(--muted)' }}>Due Date</label>
                                        <input
                                          type="date"
                                          value={t.dueDate || ''}
                                          onChange={(e) => handleTaskPropChange(idx, 'dueDate', e.target.value)}
                                          className="w-full p-1 rounded border text-[10px]"
                                          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Sync Button */}
                        {minutesTasks.some(t => !t.synced) ? (
                          <button
                            onClick={() => handleSyncTasks(m.id)}
                            disabled={syncing || !minutesTasks.some(t => t.selected !== false && !t.synced)}
                            className="w-full py-2.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                            style={{ background: '#00bea3', cursor: (syncing || !minutesTasks.some(t => t.selected !== false && !t.synced)) ? 'not-allowed' : 'pointer' }}
                          >
                            {syncing ? (
                              <>
                                <Loader2 size={13} className="animate-spin" /> Syncing with Task Board...
                              </>
                            ) : (
                              <>
                                <Check size={13} /> Sync Tasks to Kanban Board
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="p-3 rounded-lg text-center text-xs font-bold" style={{ background: 'rgba(0,190,163,0.1)', color: '#00bea3', border: '1px solid rgba(0,190,163,0.2)' }}>
                            ✓ All action items have been successfully synced to the Kanban Board!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
