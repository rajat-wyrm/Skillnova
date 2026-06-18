// ════════════════════════════════════════════════════════════
//  ADMIN — pages/Dashboard.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FileText, CalendarCheck, HelpCircle, AlertCircle, Star, Shield, Loader2 } from 'lucide-react';
import { Card, StatCard } from '../../shared/components/UI';
import api from '../../lib/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading || !stats) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  const RECENT = interns.slice(0, 5).map((i) => ({
    name: i.name, action: `Score ${i.avgScore}/10 · ${i.completedTasks} tasks`, time: 'now', color: 'green',
  }));

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Reviews" value={stats.pendingReports} icon={AlertCircle} color="#ff6d34" />
        <StatCard title="Avg Score" value={`${interns.length ? (interns.reduce((s, i) => s + i.avgScore, 0) / interns.length).toFixed(1) : 0}/10`} icon={Star} color="#00bea3" />
        <StatCard title="Verified KB" value={`${stats.verifiedArticles}/${stats.totalArticles}`} icon={HelpCircle} color="#00bea3" />
        <StatCard title="Questions" value={stats.totalQuestions} icon={FileText} color="#ff6d34" />
      </div>

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
    </div>
  );
};

export default AdminDashboard;
