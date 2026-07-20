// ════════════════════════════════════════════════════════════
//  Mentor — pages/Dashboard.jsx
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Users, FileText, AlertTriangle, Loader2, TrendingUp, Flame } from 'lucide-react';
import { Card, StatCard, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

const MentorDashboard = () => {
  const { user } = useAuthStore();
  const [interns, setInterns] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [i, r] = await Promise.all([
          api.get('/analytics/interns'),
          api.get('/reports', { params: { limit: 50, status: 'PENDING' } }),
        ]);
        setInterns(i.data.items);
        setReports(r.data.items);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const avgScore = interns.length ? (interns.reduce((s, i) => s + (i.avgScore || 0), 0) / interns.length).toFixed(1) : 0;
  const needAttention = interns.filter((i) => (i.avgScore ?? 0) < 7 || (i.attendanceRate ?? 0) < 75);

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-5 sm:p-8 text-white" style={{ background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)' }}>
        <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: '#A78BFA' }}>Captain Overview</p>
        <h1 className="text-2xl sm:text-3xl font-bold">Good day, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="opacity-80 mt-2 text-sm">You have {interns.length} intern{interns.length !== 1 ? 's' : ''} and {reports.length} report{reports.length !== 1 ? 's' : ''} pending review.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Interns" value={interns.length} icon={Users} color="#7C3AED" />
        <StatCard title="Reports to Review" value={reports.length} icon={FileText} color="#ff6d34" />
        <StatCard title="Avg Intern Score" value={avgScore} icon={TrendingUp} color="#00bea3" subtitle="/10" />
        <StatCard title="Need Attention" value={needAttention.length} icon={AlertTriangle} color="#dc2626" />
      </div>

      <Card className="p-5 overflow-hidden">
        <SectionHeader title="My Interns" subtitle="Click an intern to see their reports and tasks" />
        <div className="sn-table-scroll -mx-1">
          <table className="w-full text-sm min-w-[40rem]">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Intern', 'Department', 'Avg Score', 'Tasks Done', 'Attendance', 'Streak'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interns.map((i) => (
                <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{i.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{i.department}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: i.avgScore >= 7 ? '#00bea3' : '#f59e0b' }}>{i.avgScore || '—'}/10</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{i.completedTasks}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: i.attendanceRate >= 90 ? 'rgba(0,190,163,0.12)' : i.attendanceRate >= 75 ? 'rgba(245,158,11,0.12)' : 'rgba(220,38,38,0.12)', color: i.attendanceRate >= 90 ? '#00bea3' : i.attendanceRate >= 75 ? '#d97706' : '#dc2626' }}>
                      {i.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: i.currentStreak > 0 ? 'rgba(255,109,52,0.12)' : 'rgba(148,163,184,0.12)', color: i.currentStreak > 0 ? '#ff6d34' : 'var(--muted)' }}>
                      {i.currentStreak ?? 0} <Flame size={12} fill={i.currentStreak > 0 ? '#ff6d34' : 'transparent'} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default MentorDashboard;
