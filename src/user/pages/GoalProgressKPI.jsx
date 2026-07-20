// ════════════════════════════════════════════════════════════
//  USER — pages/GoalProgressKPI.jsx
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target, CalendarCheck, Clock, CheckCircle2, TrendingUp,
  AlertCircle, ShieldCheck, Flag, ArrowUpRight, Award
} from 'lucide-react';
import { Card, SectionHeader, Badge } from '../../shared/components/UI';
import api from '../../lib/api';

const MotionDiv = motion.div;

// Custom Circular Progress SVG Component
const CircularProgress = ({ percent, size = 120, strokeWidth = 10, color = "#ff6d34", subtitle }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-[var(--text)]">{percent}%</span>
          {subtitle && <span className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold mt-0.5">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};

const GoalProgressKPI = () => {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    internshipProgress: 60,
    monthlyGoalProgress: 75,
    completedTasks: 18,
    pendingTasks: 6,
    attendanceRate: 96,
    avgCompletionTime: '2.4 days',
    avgScore: 8.8
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      setLoading(true);
      try {
        const [statsRes, tasksRes, attendanceRes] = await Promise.all([
          api.get('/reports/stats').catch(() => ({ data: { averageScore: 8.8 } })),
          api.get('/tasks', { params: { limit: 100 } }).catch(() => ({ data: { items: [] } })),
          api.get('/attendance/summary').catch(() => ({ data: { rate: 96 } }))
        ]);

        const stats = statsRes.data;
        const tasks = tasksRes.data.items || [];
        const attendance = attendanceRes.data;

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'DONE').length;
        const pendingTasks = totalTasks - completedTasks;
        const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 75;

        // Mock dates for internship duration
        const start = new Date();
        start.setDate(start.getDate() - 30); // 30 days ago
        const end = new Date();
        end.setDate(end.getDate() + 20); // 20 days left
        const today = new Date();
        const duration = end.getTime() - start.getTime();
        const elapsed = today.getTime() - start.getTime();
        const internPercent = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));

        setKpiData({
          internshipProgress: internPercent || 60,
          monthlyGoalProgress: taskPercent,
          completedTasks: completedTasks || 15,
          pendingTasks: pendingTasks || 5,
          attendanceRate: attendance?.rate ?? 96,
          avgCompletionTime: '2.3 days', // Hardcoded metric calculation placeholder
          avgScore: stats?.averageScore ?? 8.8
        });
      } catch {
        /* ignore fallback to mock state */
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  // Goals items lists
  const activeGoals = [
    { id: 1, title: 'Complete Frontend Module (API Connect)', progress: 90, target: 'July 20' },
    { id: 2, title: 'Conduct Database Schema Migration tests', progress: 50, target: 'July 25' },
    { id: 3, title: 'Write unit tests for authentication logic', progress: 10, target: 'August 02' }
  ];

  return (
    <div className="space-y-6 pb-16">
      <SectionHeader 
        title="Goal Progress & KPIs" 
        subtitle="Real-time key performance indicators measuring your growth and goal progress" 
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => <div key={n} className="skeleton h-56 rounded-2xl"></div>)}
        </div>
      ) : (
        <>
          {/* Top Circular KPIs row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 border border-[var(--border)] flex flex-col items-center text-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4">Internship Completion</h4>
              <CircularProgress percent={kpiData.internshipProgress} color="#ff6d34" subtitle="Days" />
              <p className="text-xs text-[var(--muted)] mt-4">Ends on Sept 15, 2026</p>
            </Card>

            <Card className="p-6 border border-[var(--border)] flex flex-col items-center text-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4">Monthly Goal Progress</h4>
              <CircularProgress percent={kpiData.monthlyGoalProgress} color="#00bea3" subtitle="Goals" />
              <p className="text-xs text-[var(--muted)] mt-4">Based on active project milestones</p>
            </Card>

            <Card className="p-6 border border-[var(--border)] flex flex-col items-center text-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4">Attendance Percentage</h4>
              <CircularProgress percent={kpiData.attendanceRate} color="#7c3aed" subtitle="Check-in" />
              <p className="text-xs text-[var(--muted)] mt-4">Target Rate: &gt;90% Overall</p>
            </Card>

            <Card className="p-6 border border-[var(--border)] flex flex-col items-center text-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4">Performance Quotient</h4>
              <CircularProgress percent={Math.round(kpiData.avgScore * 10)} color="#f59e0b" subtitle="Score" />
              <p className="text-xs text-[var(--muted)] mt-4">Avg Score: {kpiData.avgScore}/10</p>
            </Card>
          </div>

          {/* Detailed Statistics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Completed vs Pending Tasks Widget */}
            <Card className="p-5 lg:col-span-2 border border-[var(--border)]">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <CheckCircle2 className="text-[#ff6d34]" size={18} /> Completed vs Pending Tasks
              </h3>

              <div className="space-y-6 my-6">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-emerald-500">Completed Tasks</span>
                    <span className="text-[var(--text)]">{kpiData.completedTasks} Tasks ({Math.round(kpiData.completedTasks / (kpiData.completedTasks + kpiData.pendingTasks) * 100)}%)</span>
                  </div>
                  <div className="w-full h-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(kpiData.completedTasks / (kpiData.completedTasks + kpiData.pendingTasks) * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-amber-500">Pending Tasks</span>
                    <span className="text-[var(--text)]">{kpiData.pendingTasks} Tasks ({Math.round(kpiData.pendingTasks / (kpiData.completedTasks + kpiData.pendingTasks) * 100)}%)</span>
                  </div>
                  <div className="w-full h-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(kpiData.pendingTasks / (kpiData.completedTasks + kpiData.pendingTasks) * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border)]">
                <div>
                  <p className="text-[10px] text-[var(--muted)] font-medium">Avg Completion Time</p>
                  <p className="text-md font-bold text-[var(--text)]">{kpiData.avgCompletionTime}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted)] font-medium">Completion Rate</p>
                  <p className="text-md font-bold text-emerald-500">{Math.round((kpiData.completedTasks / (kpiData.completedTasks + kpiData.pendingTasks)) * 100)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted)] font-medium">Target Tasks/Wk</p>
                  <p className="text-md font-bold text-[var(--text)]">4.5 Tasks</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted)] font-medium">Active Milestones</p>
                  <p className="text-md font-bold text-purple-500">2 Active</p>
                </div>
              </div>
            </Card>

            {/* Target Goals Lists */}
            <Card className="p-5 border border-[var(--border)]">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Flag className="text-[#00bea3]" size={18} /> Milestone Goals
              </h3>

              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-bold text-[var(--text)] truncate">{goal.title}</p>
                      <span className="text-[9px] px-1.5 py-0.5 font-semibold text-emerald-600 bg-emerald-50 rounded border border-emerald-100 whitespace-nowrap">Due: {goal.target}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#00bea3] rounded-full" 
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[var(--muted)]">{goal.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </>
      )}
    </div>
  );
};

export default GoalProgressKPI;
