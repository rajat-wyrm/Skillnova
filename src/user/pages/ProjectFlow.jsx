// ════════════════════════════════════════════════════════════
//  USER — pages/ProjectFlow.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, PlayCircle, Activity, Loader2 } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';

const MotionDiv = motion.div;
const CHART_COLORS = ['#00bea3', '#ff6d34', '#f59e0b', '#3b82f6'];

const ProjectFlow = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, t] = await Promise.all([api.get('/projects', { params: { limit: 20 } }), api.get('/tasks', { params: { limit: 100 } })]);
        setProjects(p.data.items);
        setTasks(t.data.items);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const statuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const statusDistribution = statuses.map((s) => ({
    name: s.replace('_', ' '),
    value: tasks.filter((t) => t.status === s).length,
  })).filter((s) => s.value > 0);

  const progress = [
    { name: 'Start', progress: 10, tasks: 5 },
    { name: 'Sprint 1', progress: 30, tasks: 12 },
    { name: 'Sprint 2', progress: 55, tasks: 18 },
    { name: 'Sprint 3', progress: 80, tasks: 24 },
    { name: 'Ship', progress: 100, tasks: 30 },
  ];

  return (
    <div className="space-y-6">
      <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-xl overflow-hidden shadow-lg p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #1a1f20 0%, #2D3436 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #00bea3, #3b82f6)' }} />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">SkillNova Platform</h1>
        <p className="mt-2 text-sm sm:text-base" style={{ color: '#9ca3af' }}>
          You are part of <span style={{ color: '#00bea3', fontWeight: 600 }}>{projects.length} active project{projects.length !== 1 ? 's' : ''}</span> with{' '}
          <span style={{ color: '#ff6d34', fontWeight: 600 }}>{tasks.filter((t) => t.status !== 'DONE').length} open tasks</span>.
        </p>
      </MotionDiv>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <SectionHeader title="Project Milestones" subtitle="Your roadmap" />
          <div className="space-y-4">
            {projects.slice(0, 6).map((p, i) => {
              const isCompleted = p.status === 'COMPLETED';
              const isActive = p.status === 'ACTIVE';
              const Icon = isCompleted ? CheckCircle : isActive ? PlayCircle : Clock;
              return (
                <div key={p.id} className="relative flex items-start gap-4">
                  {i !== Math.min(projects.length, 6) - 1 && (
                    <div className="absolute left-[19px] top-8 bottom-[-16px] w-[2px]" style={{ background: isCompleted ? '#00bea3' : 'var(--border)' }} />
                  )}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: isCompleted ? 'rgba(0,190,163,0.15)' : isActive ? 'rgba(255,109,52,0.15)' : 'var(--bg)', border: `1px solid ${isCompleted ? '#00bea3' : isActive ? '#ff6d34' : 'var(--border)'}` }}>
                    <Icon size={20} color={isCompleted ? '#00bea3' : isActive ? '#ff6d34' : 'var(--muted)'} />
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.name}</h4>
                    <span className="text-xs uppercase tracking-wider font-bold mt-1 inline-block"
                      style={{ color: isCompleted ? '#00bea3' : isActive ? '#ff6d34' : 'var(--muted)' }}>
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No projects assigned yet.</p>}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Activity size={18} style={{ color: '#00bea3' }} /> Progress Overview
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={progress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00bea3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00bea3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)', borderRadius: 8 }} />
                <Area type="monotone" dataKey="progress" stroke="#00bea3" fillOpacity={1} fill="url(#colorProgress)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Task Distribution</h3>
            {statusDistribution.length === 0 ? <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No tasks assigned.</p> : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={statusDistribution} innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                      {statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3 w-full">
                  {statusDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span style={{ color: 'var(--muted)' }}>{item.name}</span>
                      </div>
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectFlow;
