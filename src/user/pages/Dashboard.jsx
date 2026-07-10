// ════════════════════════════════════════════════════════════
//  USER — pages/Dashboard.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle, ClipboardList, CalendarCheck, TrendingUp, MessageSquare, Loader2,
} from 'lucide-react';
import { Card, StatCard, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { formatRelative } from '../../lib/utils';

const MotionDiv = motion.div;
const CHART_C = ['#ff6d34', '#00bea3', '#7C3AED', '#f59e0b', '#06b6d4'];

const Dashboard = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, r, t, a] = await Promise.all([
          api.get('/reports/stats'),
          api.get('/reports', { params: { limit: 5 } }),
          api.get('/tasks', { params: { limit: 50 } }),
          api.get('/attendance/summary'),
        ]);
        setStats(s.data);
        setMyReports(r.data.items);
        setMyTasks(t.data.items);
        setAttendance(a.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  const myTasksByStatus = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((status) => ({
    name: status.replace('_', ' '),
    value: myTasks.filter((t) => t.status === status).length,
  })).filter((s) => s.value > 0);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

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
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            {greeting},<br className="sm:hidden" /> {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="mt-4 text-sm sm:text-base font-medium text-slate-400 max-w-lg leading-relaxed">
            You have <span className="text-white font-bold">{myTasks.filter((t) => t.status !== 'DONE').length} pending tasks</span>{' '}
            and {stats?.pending ?? 0} reports awaiting review.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-6 max-w-xl">
            {[
              [stats?.reviewed ?? 0, 'Reports'],
              [`${attendance?.rate ?? 0}%`, 'Attendance'],
              [`${user?.rating?.toFixed(1) ?? '—'}`, 'Score'],
            ].map(([v, l]) => (
              <div key={l} className="bg-white/5 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
                <p className="font-black text-xl text-white">{v}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: '#ff6d34' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </MotionDiv>

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Reports"   value={stats?.total ?? 0}    icon={ClipboardList} color="#ff6d34" />
        <StatCard title="Reviewed"        value={stats?.reviewed ?? 0} icon={CheckCircle}   color="#00bea3" />
        <StatCard title="Attendance Rate" value={`${attendance?.rate ?? 0}%`} icon={CalendarCheck} color="#ff6d34" />
        <StatCard title="Avg Score"       value={stats?.averageScore?.toFixed(1) ?? '—'} icon={TrendingUp} color="#00bea3" subtitle="/10" />
      </div>

      <div className="grid grid-cols-1 min-[640px]:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>My Tasks by Status</h3>
          {myTasksByStatus.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No tasks yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={myTasksByStatus} dataKey="value" nameKey="name" outerRadius={75} innerRadius={45} paddingAngle={3}>
                  {myTasksByStatus.map((_, i) => <Cell key={i} fill={CHART_C[i % CHART_C.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {myTasksByStatus.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {myTasksByStatus.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_C[i % CHART_C.length] }} />
                  <span style={{ color: 'var(--muted)' }} className="truncate">{s.name}</span>
                  <span className="font-semibold ml-auto" style={{ color: 'var(--text)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Recent Reports</h3>
          {myReports.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No reports submitted yet.</p>
          ) : (
            <div className="space-y-2.5">
              {myReports.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: r.status === 'REVIEWED' ? 'rgba(0,190,163,0.15)' : 'rgba(255,109,52,0.15)' }}>
                    <CheckCircle size={14} style={{ color: r.status === 'REVIEWED' ? '#00bea3' : '#ff6d34' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{r.title}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{formatRelative(r.submittedAt)} · {r.status}</p>
                  </div>
                  {r.score != null && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
                      {r.score}/10
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeader title="Open Tasks" subtitle="What you're working on right now" />
        {myTasks.filter((t) => t.status !== 'DONE').length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>All caught up — no open tasks 🎉</p>
        ) : (
          <div className="space-y-2">
            {myTasks.filter((t) => t.status !== 'DONE').slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: t.priority === 'HIGH' || t.priority === 'URGENT' ? '#ff6d34' : t.priority === 'MEDIUM' ? '#f59e0b' : '#94a3b8' }} />
                <p className="text-sm flex-1 truncate" style={{ color: 'var(--text)' }}>{t.title}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(255,109,52,0.15)', color: '#ff6d34' }}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {onNavigate && (
        <button onClick={() => onNavigate('qa')}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-110 transition-transform z-50 group"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }} title="Q&A Forum">
          <MessageSquare className="text-white" />
          <span className="absolute right-full mr-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">Q&A Forum</span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;
