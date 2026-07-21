// ════════════════════════════════════════════════════════════
//  ADMIN — pages/DailyMeeting.jsx
//  Set / update / clear today's daily standup.
//  Interns see this on their dashboard banner and get a
//  30-min-before reminder + start-time alarm automatically.
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Link2, Clock, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';

const MotionDiv = motion.div;

function toLocalInputValue(dateLike) {
  const d = new Date(dateLike);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

function defaultSevenPmToday() {
  const d = new Date();
  d.setHours(19, 0, 0, 0);
  return toLocalInputValue(d);
}

const DailyMeeting = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [current, setCurrent] = useState(null);
  const [title, setTitle] = useState('Daily Standup');
  const [link, setLink] = useState('');
  const [startsAt, setStartsAt] = useState(defaultSevenPmToday());
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  const loadToday = async () => {
    try {
      const { data } = await api.get('/meetings/today');
      if (data?.active) {
        setCurrent(data);
        setTitle(data.title || 'Daily Standup');
        setLink(data.link || '');
        setStartsAt(data.startsAt ? toLocalInputValue(data.startsAt) : defaultSevenPmToday());
      } else {
        setCurrent(null);
      }
    } catch {
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadToday();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.post('/meetings/today', {
        title,
        link: link || undefined,
        startsAt: new Date(startsAt).toISOString(),
      });
      setCurrent(data);
      setMessage({ type: 'success', text: 'Saved. Interns will be notified 30 minutes before, and alerted when it starts.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to save meeting.' });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setMessage(null);
    try {
      await api.delete('/meetings/today');
      setCurrent(null);
      setMessage({ type: 'success', text: 'Cleared — no meeting scheduled for today.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to clear meeting.' });
    } finally {
      setClearing(false);
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
    <div className="space-y-6 pb-16">
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #2D3436 0%, #1a1f20 60%, #2D3436 100%)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #ff6d34, #00bea3)' }} />
        <div className="relative p-7 sm:p-10">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color: '#00bea3' }}>
            Daily Standup · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight flex items-center gap-3">
            <Video size={32} style={{ color: '#00bea3' }} />
            Set Today's Meeting
          </h1>
          <p className="mt-3 text-sm sm:text-base font-medium text-slate-400 max-w-lg leading-relaxed">
            {current
              ? 'A standup is scheduled for today. Interns see this on their dashboard, get a reminder 30 minutes before, and an alarm at start time.'
              : 'No standup scheduled today. Set a link and time below to notify every intern.'}
          </p>
        </div>
      </MotionDiv>

      {message && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
          style={{
            background: message.type === 'success' ? 'rgba(0,190,163,0.1)' : 'rgba(239,68,68,0.1)',
            color: message.type === 'success' ? '#00bea3' : '#ef4444',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <Card className="p-6">
        <SectionHeader title="Meeting details" subtitle="Saved changes take effect immediately" />
        <form onSubmit={handleSave} className="space-y-5 mt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Daily Standup"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>
              <Link2 size={13} /> Meeting link
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>
              <Clock size={13} /> Start time
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: '#ff6d34' }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {current ? 'Update meeting' : 'Schedule meeting'}
            </button>

            {current && (
              <button
                type="button"
                onClick={handleClear}
                disabled={clearing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Clear meeting
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DailyMeeting;