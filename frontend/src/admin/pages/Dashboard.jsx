// ════════════════════════════════════════════════════════════
//  ADMIN — pages/Dashboard.jsx (API-driven + Live Announcements)
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FileText, CalendarCheck, HelpCircle, AlertCircle, Star, Shield,
  Loader2, Megaphone, Zap, Bell, ChevronRight, RefreshCw, Sparkles
} from 'lucide-react';
import { Card, StatCard, Badge } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { getSocket } from '../../lib/socket';
import { formatRelative } from '../../lib/utils';

const PRIORITY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
const PRIORITY_BG = { HIGH: 'rgba(239,68,68,0.08)', MEDIUM: 'rgba(245,158,11,0.08)', LOW: 'rgba(16,185,129,0.08)' };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [liveToasts, setLiveToasts] = useState([]); // live push notification toasts
  const [sendingEvent, setSendingEvent] = useState(false);
  const [newNotifCount, setNewNotifCount] = useState(0);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const { data } = await api.get('/announcements', { params: { limit: 8, sort: 'publishedAt', order: 'desc' } });
      setAnnouncements(data.items || []);
    } catch {
      /* ignore */
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [s, i] = await Promise.all([
          api.get('/analytics/platform'),
          api.get('/analytics/interns'),
        ]);
        setStats(s.data);
        setInterns(i.data.items);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // 🔔 Live socket — show push toast when a broadcast arrives
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onBroadcast = (payload) => {
      if (payload.type === 'announcement') {
        const id = Date.now();
        setLiveToasts((prev) => [{ id, ...payload }, ...prev].slice(0, 5));
        setNewNotifCount((c) => c + 1);
        // Auto-dismiss after 6s
        setTimeout(() => setLiveToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
        // Refresh announcements list
        fetchAnnouncements();
      }
    };

    const onNotification = () => {
      setNewNotifCount((c) => c + 1);
      fetchAnnouncements();
    };

    socket.on('broadcast', onBroadcast);
    socket.on('notification', onNotification);
    return () => {
      socket.off('broadcast', onBroadcast);
      socket.off('notification', onNotification);
    };
  }, [fetchAnnouncements]);

  // Manual "Push Random Event" button
  const triggerRandomEvent = async () => {
    setSendingEvent(true);
    try {
      await api.post('/announcements', {
        title: `🎯 Live Event: ${new Date().toLocaleTimeString()} — Quick Announcement`,
        body: `This is a live push notification test at ${new Date().toLocaleString()}. All active users have been notified in real-time via Socket.io. The notification system is working perfectly!`,
        priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
        pinned: false,
      });
      notify.success('📢 Random event pushed to all users!');
      fetchAnnouncements();
    } catch {
      notify.error('Failed to push event.');
    } finally {
      setSendingEvent(false);
    }
  };

  if (loading || !stats) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* ── Hero Banner ─────────────────────────── */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1f20 0%, #2D3436 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #ff6d34, #00bea3)' }} />
        <div className="relative p-4 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium mb-1" style={{ color: '#ff6d34' }}>Admin Overview · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Platform Dashboard</h1>
              <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Monitor interns, knowledge base and platform activity</p>
            </div>
            <div className="rounded-xl p-3 self-start" style={{ background: 'rgba(255,109,52,0.15)', border: '1px solid rgba(255,109,52,0.3)' }}>
              <Shield size={26} style={{ color: '#ff6d34' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              [stats.totalInterns, 'Total Interns'],
              [stats.activeUsers, 'Active Users'],
              [stats.pendingReports, 'Pending Reports'],
              [stats.totalArticles, 'KB Articles'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-xl font-bold text-white">{v}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Reviews" value={stats.pendingReports} icon={AlertCircle} color="#ff6d34" />
        <StatCard title="Avg Score" value={`${interns.length ? (interns.reduce((s, i) => s + i.avgScore, 0) / interns.length).toFixed(1) : 0}/10`} icon={Star} color="#00bea3" />
        <StatCard title="Verified KB" value={`${stats.verifiedArticles}/${stats.totalArticles}`} icon={HelpCircle} color="#00bea3" />
        <StatCard title="Questions" value={stats.totalQuestions} icon={FileText} color="#ff6d34" />
      </div>

      {/* ── Charts Row ────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Daily Logins (last 7 days)</h3>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={stats.loginsByDay}>
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00bea3" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00bea3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)' }} />
              <Area type="monotone" dataKey="count" stroke="#00bea3" fill="url(#adminGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Top Interns</h3>
          <div className="space-y-3">
            {interns.slice(0, 6).map((i) => (
              <div key={i.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}>
                  {i.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{i.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{i.department}</p>
                </div>
                <span className="text-xs font-bold" style={{ color: i.avgScore >= 7 ? '#00bea3' : '#f59e0b' }}>{i.avgScore}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════
          🔔 LIVE ANNOUNCEMENTS & PUSH NOTIFICATION SECTION
         ══════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* ── Announcements Feed ─────────────────── */}
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,109,52,0.12)' }}>
                <Megaphone size={16} style={{ color: '#ff6d34' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Live Announcements</h3>
                <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Auto-updated via push notifications</p>
              </div>
              {newNotifCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white animate-pulse"
                  style={{ background: '#ff6d34' }}>
                  +{newNotifCount} new
                </span>
              )}
            </div>
            <button
              onClick={fetchAnnouncements}
              className="p-2 rounded-lg transition hover:opacity-70"
              style={{ color: 'var(--muted)' }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {announcementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin" size={20} style={{ color: 'var(--muted)' }} />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-10" style={{ color: 'var(--muted)' }}>
              <Megaphone size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No announcements yet.</p>
              <p className="text-xs mt-1 opacity-60">Events will appear here automatically</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 rounded-xl transition"
                  style={{
                    background: PRIORITY_BG[a.priority] || 'rgba(0,0,0,0.02)',
                    border: `1px solid ${PRIORITY_COLOR[a.priority]}22`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: PRIORITY_COLOR[a.priority] || '#6b7280' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{a.title}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${PRIORITY_COLOR[a.priority]}18`, color: PRIORITY_COLOR[a.priority] }}>
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug line-clamp-2" style={{ color: 'var(--muted)' }}>{a.body}</p>
                    <p className="text-[10px] mt-1 opacity-60" style={{ color: 'var(--muted)' }}>
                      {a.author?.name} · {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : 'just now'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Push Notification Control Panel ────── */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,190,163,0.12)' }}>
              <Zap size={16} style={{ color: '#00bea3' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Push Notifications</h3>
              <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Auto-scheduled every 2 minutes</p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: 'rgba(0,190,163,0.06)', border: '1px solid rgba(0,190,163,0.15)' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#00bea3' }}></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#00bea3' }}></span>
            </span>
            <p className="text-xs font-medium" style={{ color: '#00bea3' }}>System is live & broadcasting</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="text-lg font-bold" style={{ color: '#ff6d34' }}>{stats.totalAnnouncements || announcements.length}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>Total Sent</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="text-lg font-bold" style={{ color: '#00bea3' }}>{stats.activeUsers || 0}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>Users Notified</p>
            </div>
          </div>

          {/* Manual push button */}
          <button
            onClick={triggerRandomEvent}
            disabled={sendingEvent}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: sendingEvent ? '#6b7280' : 'linear-gradient(135deg, #ff6d34, #e85d25)' }}
          >
            {sendingEvent ? (
              <><Loader2 size={15} className="animate-spin" /> Pushing…</>
            ) : (
              <><Sparkles size={15} /> Push Random Event Now</>
            )}
          </button>

          <p className="text-center text-[10px] mt-2" style={{ color: 'var(--muted)' }}>
            Auto-push also runs every 2 min via scheduler
          </p>

          {/* Event types legend */}
          <div className="mt-4 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Event Types</p>
            {[
              ['🎓', 'Guest Lectures & Talks'],
              ['🏆', 'Hackathons & Competitions'],
              ['📋', 'Deadline Reminders'],
              ['🎯', 'Performance Reviews'],
              ['🚀', 'Project Kickoffs'],
            ].map(([emoji, label]) => (
              <div key={label} className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--muted)' }}>
                <span>{emoji}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Live Toast Notifications (pop-up style) ── */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none" style={{ maxWidth: '340px' }}>
        {liveToasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #1a1f20, #2D3436)',
              border: '1px solid rgba(255,109,52,0.3)',
              animation: 'slideInRight 0.4s ease-out',
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,109,52,0.2)' }}>
              <Bell size={16} style={{ color: '#ff6d34' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-snug">{toast.title}</p>
              {toast.body && <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: '#9ca3af' }}>{toast.body}</p>}
              <p className="text-[10px] mt-1" style={{ color: '#ff6d34' }}>📢 Live broadcast</p>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
