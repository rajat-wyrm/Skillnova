// ════════════════════════════════════════════════════════════
//  USER — pages/Dashboard.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import {
  CheckCircle, ClipboardList, CalendarCheck, TrendingUp, MessageSquare, Loader2, Flame, Clock, Target, Trophy
} from 'lucide-react';
import { Card, StatCard, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { formatRelative } from '../../lib/utils';

const MotionDiv = motion.div;
const CHART_C = ['#ff6d34', '#00bea3', '#7C3AED', '#f59e0b', '#06b6d4'];

// Mock Data for Radar Chart (Skill Growth)
const skillData = [
  { subject: 'Frontend', A: 85, B: 65, fullMark: 100 },
  { subject: 'Backend', A: 70, B: 50, fullMark: 100 },
  { subject: 'Database', A: 80, B: 60, fullMark: 100 },
  { subject: 'DevOps', A: 60, B: 40, fullMark: 100 },
  { subject: 'Communication', A: 90, B: 75, fullMark: 100 },
  { subject: 'Problem Solving', A: 85, B: 70, fullMark: 100 },
];

const Dashboard = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gamification Mock State
  const [streak] = useState(7);
  const [points] = useState(1250);

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

  const upcomingDeadlines = myTasks
    .filter(t => t.status !== 'DONE')
    .slice(0, 3); // Mocking upcoming tasks for visual

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6 pb-16">
      {/* Hero Section */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl overflow-hidden shadow-2xl border border-[var(--border)]"
        style={{ background: 'linear-gradient(135deg, #1e1e24 0%, #2D3436 100%)' }}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #ff6d34, #00bea3, #7C3AED)' }} />
        
        <div className="relative p-7 sm:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-2 text-emerald-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {greeting},<br className="sm:hidden" /> {user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="mt-4 text-sm sm:text-base font-medium text-slate-300 max-w-lg leading-relaxed">
              You have <span className="text-white font-bold">{myTasks.filter((t) => t.status !== 'DONE').length} pending tasks</span>{' '}
              and {stats?.pending ?? 0} reports awaiting review.
            </p>
          </div>
          
          {/* Gamification Widget */}
          <div className="flex gap-4">
             <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg transform hover:scale-105 transition">
                <Flame className="text-orange-500 mb-1" size={28} />
                <span className="text-2xl font-black text-white">{streak}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold mt-1">Day Streak</span>
             </div>
             <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg transform hover:scale-105 transition">
                <Trophy className="text-yellow-400 mb-1" size={28} />
                <span className="text-2xl font-black text-white">{points}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold mt-1">Total Points</span>
             </div>
          </div>
        </div>
      </MotionDiv>

      {/* Stats Row */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Reports"   value={stats?.total ?? 0}    icon={ClipboardList} color="#ff6d34" />
        <StatCard title="Reviewed"        value={stats?.reviewed ?? 0} icon={CheckCircle}   color="#00bea3" />
        <StatCard title="Attendance Rate" value={`${attendance?.rate ?? 0}%`} icon={CalendarCheck} color="#3b82f6" />
        <StatCard title="Avg Score"       value={stats?.averageScore?.toFixed(1) ?? '—'} icon={TrendingUp} color="#7C3AED" subtitle="/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task Progress Ring */}
        <Card className="p-5 shadow-lg border border-[var(--border)] relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-md font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
             <Target size={18} className="text-blue-500" /> My Tasks by Status
          </h3>
          {myTasksByStatus.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No tasks yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={myTasksByStatus} dataKey="value" nameKey="name" outerRadius={80} innerRadius={55} paddingAngle={4}>
                  {myTasksByStatus.map((_, i) => <Cell key={i} fill={CHART_C[i % CHART_C.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {myTasksByStatus.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {myTasksByStatus.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs bg-[var(--input-bg)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_C[i % CHART_C.length] }} />
                  <span style={{ color: 'var(--muted)' }} className="font-medium">{s.name}</span>
                  <span className="font-bold ml-1" style={{ color: 'var(--text)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Skill Growth Radar */}
        <Card className="p-5 shadow-lg border border-[var(--border)] relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-md font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
             <TrendingUp size={18} className="text-emerald-500" /> Skill Growth Radar
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="You" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              <Radar name="Platform Avg" dataKey="B" stroke="#64748b" fill="#64748b" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="p-5 shadow-lg border border-[var(--border)] relative overflow-hidden flex flex-col">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-md font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
             <Clock size={18} className="text-orange-500" /> Upcoming Deadlines
          </h3>
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
             {upcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--muted)] opacity-70">
                   <CheckCircle size={32} className="mb-2" />
                   <span className="text-sm">You are all caught up!</span>
                </div>
             ) : (
                upcomingDeadlines.map((t, idx) => (
                   <div key={idx} className="relative bg-[var(--input-bg)] border border-[var(--border)] p-3 rounded-xl flex flex-col gap-2 hover:border-orange-500/30 transition group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <p className="text-sm font-bold truncate text-[var(--text)]">{t.title}</p>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-orange-500 font-semibold flex items-center gap-1"><Clock size={12}/> Due in 2 days</span>
                         <span className="bg-[var(--bg)] px-2 py-0.5 rounded text-[var(--muted)] font-medium border border-[var(--border)]">{t.status.replace('_', ' ')}</span>
                      </div>
                   </div>
                ))
             )}
          </div>
        </Card>
      </div>

      {/* Bottom Area - Open Tasks & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <Card className="p-5 shadow-lg border border-[var(--border)]">
            <SectionHeader title="Open Tasks" subtitle="What you're working on right now" />
            {myTasks.filter((t) => t.status !== 'DONE').length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>All caught up — no open tasks 🎉</p>
            ) : (
            <div className="space-y-2 mt-4">
               {myTasks.filter((t) => t.status !== 'DONE').slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] hover:border-blue-500/30 transition cursor-pointer group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg)' }}>
                     <Target size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{t.title}</p>
                     <p className="text-xs text-[var(--muted)] mt-0.5">Priority: {t.priority}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-bold shadow-sm"
                     style={{ background: 'rgba(255,109,52,0.1)', color: '#ff6d34', border: '1px solid rgba(255,109,52,0.2)' }}>
                     {t.status.replace('_', ' ')}
                  </span>
                  </div>
               ))}
            </div>
            )}
         </Card>

         <Card className="p-5 shadow-lg border border-[var(--border)]">
            <h3 className="text-md font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
               <ClipboardList size={18} className="text-purple-500" /> Recent Reports
            </h3>
            {myReports.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No reports submitted yet.</p>
            ) : (
            <div className="space-y-3 mt-4">
               {myReports.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] hover:border-purple-500/30 transition">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ background: r.status === 'REVIEWED' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>
                     <CheckCircle size={18} style={{ color: r.status === 'REVIEWED' ? '#10b981' : '#f59e0b' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{r.title}</p>
                     <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{formatRelative(r.submittedAt)} · <span className="font-semibold uppercase tracking-wider text-[10px]">{r.status}</span></p>
                  </div>
                  {r.score != null && (
                     <div className="flex flex-col items-center justify-center px-3 py-1 rounded-lg border" style={{ background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.2)' }}>
                        <span className="text-sm font-black text-purple-600">{r.score}</span>
                        <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Score</span>
                     </div>
                  )}
                  </div>
               ))}
            </div>
            )}
         </Card>
      </div>

      {onNavigate && (
        <button onClick={() => onNavigate('qa')}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-110 transition-transform z-50 group"
          style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }} title="Q&A Forum">
          <MessageSquare className="text-white" />
          <span className="absolute right-full mr-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">Ask a Question</span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;
