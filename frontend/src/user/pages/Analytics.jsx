// ════════════════════════════════════════════════════════════
//  USER — pages/Analytics.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, CheckCircle, Clock, Star } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, StatCard, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';

const COLORS = ['#ff6d34', '#00bea3', '#7C3AED', '#f59e0b', '#06b6d4'];

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, r, t] = await Promise.all([
          api.get('/reports/stats'),
          api.get('/reports', { params: { limit: 50 } }),
          api.get('/tasks', { params: { limit: 50 } }),
        ]);
        setStats(s.data);
        setReports(r.data.items);
        setTasks(t.data.items);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading || !stats) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const scoreByWeek = reports.slice(0, 8).reverse().map((r, i) => ({
    name: `W${r.weekNumber ?? i + 1}`,
    score: r.score ?? 0,
  }));
  const tasksByStatus = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((s) => ({
    name: s.replace('_', ' '), value: tasks.filter((t) => t.status === s).length,
  })).filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <SectionHeader title="My Analytics" subtitle="Your personal performance insights" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Reports Submitted" value={stats.total} icon={CheckCircle} color="#ff6d34" />
        <StatCard title="Reports Reviewed" value={stats.reviewed} icon={Star} color="#00bea3" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="#f59e0b" />
        <StatCard title="Avg Score" value={(stats.averageScore ?? 0).toFixed(1)} icon={TrendingUp} color="#7C3AED" subtitle="/10" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Weekly Score Trend</h3>
          {scoreByWeek.length === 0 ? <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>No reviewed reports yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={scoreByWeek}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6d34" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff6d34" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)' }} />
                <Area type="monotone" dataKey="score" stroke="#ff6d34" fill="url(#scoreGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Task Distribution</h3>
          {tasksByStatus.length === 0 ? <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>No tasks yet.</p> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={tasksByStatus} dataKey="value" nameKey="name" outerRadius={70} innerRadius={40} paddingAngle={3}>
                    {tasksByStatus.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {tasksByStatus.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    <span style={{ color: 'var(--muted)' }} className="truncate">{s.name}</span>
                    <span className="font-semibold ml-auto" style={{ color: 'var(--text)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-5 overflow-hidden">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Recent Reports</h3>
        <div className="sn-table-scroll -mx-1">
          <table className="w-full text-sm min-w-[36rem]">
            <thead><tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              {['Title', 'Week', 'Status', 'Score'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {reports.slice(0, 10).map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{r.title}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>W{r.weekNumber ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700' : r.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{r.status}</span></td>
                  <td className="px-4 py-3">{r.score != null ? <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">⭐ {r.score}/10</span> : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
