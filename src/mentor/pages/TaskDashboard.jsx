// ════════════════════════════════════════════════════════════
//  Mentor — pages/TaskDashboard.jsx
//  Overview stats + status breakdown + per-intern load
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { ListChecks, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, SectionHeader, StatCard } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const CHART_COLORS = { TODO: '#94a3b8', IN_PROGRESS: '#ff6d34', REVIEW: '#7C3AED', DONE: '#00bea3', BLOCKED: '#dc2626' };

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks', { params: { limit: 100 } })
      .then((r) => setTasks(r.data.items))
      .catch(() => notify.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const overdue = tasks.filter((t) => t.dueDate && t.status !== 'DONE' && new Date(t.dueDate) < new Date()).length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completionRate = total ? Math.round((done / total) * 100) : 0;

  const distribution = Object.keys(CHART_COLORS)
    .map((s) => ({ name: s.replace('_', ' '), key: s, value: tasks.filter((t) => t.status === s).length }))
    .filter((s) => s.value > 0);

  const byIntern = {};
  tasks.forEach((t) => {
    if (!t.assignee) return;
    byIntern[t.assignee.id] = byIntern[t.assignee.id] || { name: t.assignee.name, total: 0, done: 0 };
    byIntern[t.assignee.id].total += 1;
    if (t.status === 'DONE') byIntern[t.assignee.id].done += 1;
  });
  const internRows = Object.values(byIntern).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <SectionHeader title="Task Dashboard" subtitle="Overview of all tasks across your projects" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total tasks" value={total} icon={ListChecks} color="#ff6d34" />
        <StatCard title="In progress" value={inProgress} icon={Clock} color="#f59e0b" />
        <StatCard title="Overdue" value={overdue} icon={AlertTriangle} color="#dc2626" />
        <StatCard title="Completion rate" value={`${completionRate}%`} subtitle={`${done}/${total}`} icon={CheckCircle2} color="#00bea3" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Status breakdown</h3>
          {distribution.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No tasks yet.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={distribution} innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                    {distribution.map((d) => <Cell key={d.key} fill={CHART_COLORS[d.key]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 w-full">
                {distribution.map((d) => (
                  <div key={d.key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[d.key] }} />
                      <span style={{ color: 'var(--muted)' }}>{d.name}</span>
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Load by intern</h3>
          {internRows.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No tasks assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {internRows.map((row) => {
                const pct = row.total ? Math.round((row.done / row.total) * 100) : 0;
                return (
                  <div key={row.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text)' }} className="font-medium">{row.name}</span>
                      <span style={{ color: 'var(--muted)' }}>{row.done}/{row.total} done</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                      <div style={{ width: `${pct}%`, background: '#00bea3', height: '100%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TaskDashboard;