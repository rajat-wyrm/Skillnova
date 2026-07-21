// ════════════════════════════════════════════════════════════
//  USER — components/MeetingBanner.jsx
//  Shows today's daily standup (if any). Listens for
//  'meeting:reminder' (30 min before) and 'meeting:alarm'
//  (at start time) over the socket connection.
// ════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Bell } from 'lucide-react';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';

const MotionDiv = motion.div;

// Synthesized beep — no audio file to manage or forget to upload.
function playAlarmBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const beepAt = (delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.4);
    };
    // three short beeps
    beepAt(0);
    beepAt(0.5);
    beepAt(1.0);
  } catch {
    /* Web Audio unsupported — fail silently */
  }
}

const MeetingBanner = () => {
  const [meeting, setMeeting] = useState(null);
  const [ringing, setRinging] = useState(false);
  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    (async () => {
      try {
        const { data } = await api.get('/meetings/today');
        if (data?.active) setMeeting(data);
      } catch {
        /* no meeting today, or fetch failed — banner just stays hidden */
      }
    })();

    const socket = getSocket();
    if (!socket) return;

    const onReminder = (payload) => {
      setMeeting((prev) => ({ ...(prev || {}), active: true, ...payload }));
    };
    const onAlarm = (payload) => {
      setMeeting((prev) => ({ ...(prev || {}), active: true, ...payload }));
      setRinging(true);
      playAlarmBeep();
    };

    socket.on('meeting:reminder', onReminder);
    socket.on('meeting:alarm', onAlarm);

    return () => {
      socket.off('meeting:reminder', onReminder);
      socket.off('meeting:alarm', onAlarm);
    };
  }, []);

  if (!meeting?.active) return null;

  const time = meeting.startsAt
    ? new Date(meeting.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl px-5 py-4 border"
        style={{
          background: ringing ? 'rgba(255,109,52,0.12)' : 'rgba(0,190,163,0.08)',
          borderColor: ringing ? '#ff6d34' : 'rgba(0,190,163,0.3)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: ringing ? 'rgba(255,109,52,0.2)' : 'rgba(0,190,163,0.15)' }}
          >
            {ringing ? (
              <Bell size={16} className="animate-pulse" style={{ color: '#ff6d34' }} />
            ) : (
              <Video size={16} style={{ color: '#00bea3' }} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {ringing ? 'Daily standup is starting now' : (meeting.title || 'Daily standup today')}
            </p>
            {time && (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {ringing ? 'Join now' : `Starts at ${time}`}
              </p>
            )}
          </div>
        </div>

        {meeting.link && (
          <a
            href={meeting.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white text-center transition hover:opacity-90"
            style={{ background: ringing ? '#ff6d34' : '#00bea3' }}
          >
            Join meeting
          </a>
        )}
      </MotionDiv>
    </AnimatePresence>
  );
};

export default MeetingBanner;