// ════════════════════════════════════════════════════════════
//  ADMIN — pages/Analytics.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { FileText, TrendingUp, BookOpen, MessageSquare, Loader2, Users, ShieldCheck } from 'lucide-react';
import { Card, StatCard, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626'];

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, i] = await Promise.all([api.get('/analytics/platform'), api.get('/analytics/interns')]);
        setStats(s.data); setInterns(i.data.items);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading || !stats) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const deptData = ['AI/ML', 'Web Dev', 'Data Science', 'Backend', 'Frontend'].map((d) => ({
    name: d, value: interns.filter((i) => i.department === d).length,
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <SectionHeader title="Platform Analytics" subtitle="Insights across all interns, reports and platform activity" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"     value={stats.totalUsers} icon={Users} color="#2563EB" />
        <StatCard title="Active Users"    value={stats.activeUsers} icon={ShieldCheck} color="#059669" />
        <StatCard title="Total Reports"   value={stats.totalReports} icon={FileText} color="#7C3AED" />
        <StatCard title="KB Articles"     value={stats.totalArticles} icon={BookOpen} color="#D97706" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Daily Logins (last 7 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.loginsByDay}>
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)' }} />
              <Area type="monotone" dataKey="count" stroke="#7C3AED" fill="url(#lg)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Interns by Department</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={deptData} dataKey="value" nameKey="name" outerRadius={75} innerRadius={40} paddingAngle={3}>
                {deptData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {deptData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <span className="truncate" style={{ color: 'var(--muted)' }}>{d.name}</span>
                <span className="font-semibold ml-auto" style={{ color: 'var(--text)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Intern Performance Scores</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={interns.map((i) => ({ name: i.name?.split(' ')[0], score: i.avgScore || 0 }))}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)' }} />
              <Bar dataKey="score" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 overflow-hidden">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Performance Summary</h3>
          <div className="sn-table-scroll -mx-1">
            <table className="w-full text-sm min-w-[36rem]">
              <thead><tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Intern', 'Department', 'Score', 'Tasks', 'Attendance'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {interns.map((i) => (
                  <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{i.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{i.department}</td>
                    <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#d97706' }}>⭐ {i.avgScore || 0}</span></td>
                    <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{i.completedTasks}</td>
                    <td className="px-4 py-3">{i.attendanceRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
