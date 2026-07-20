// ════════════════════════════════════════════════════════════
//  ADMIN — pages/DepartmentAnalytics.jsx
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import {
  Building2, Users, ClipboardList, Star, Award, TrendingUp,
  ShieldCheck, Briefcase, Loader2
} from 'lucide-react';
import { Card, StatCard, SectionHeader, Badge } from '../../shared/components/UI';
import api from '../../lib/api';

const MotionDiv = motion.div;
const COLORS = ['#ff6d34', '#00bea3', '#7C3AED', '#f59e0b', '#06b6d4', '#ec4899'];

// Mock Admin department & mentor data
const MOCK_DEPT_SUMMARY = [
  { name: 'AI/ML', interns: 12, avgScore: 8.9, tasksCompleted: 142, attendance: 97, completionRate: 85 },
  { name: 'Web Dev', interns: 18, avgScore: 8.4, tasksCompleted: 198, attendance: 95, completionRate: 78 },
  { name: 'Data Science', interns: 8, avgScore: 8.6, tasksCompleted: 78, attendance: 94, completionRate: 80 },
  { name: 'Backend', interns: 14, avgScore: 8.2, tasksCompleted: 124, attendance: 92, completionRate: 74 },
  { name: 'Frontend', interns: 10, avgScore: 8.5, tasksCompleted: 98, attendance: 93, completionRate: 76 }
];

const MOCK_MENTORS_WORKLOAD = [
  { name: 'Dr. Alice Vance', interns: 8, expertise: 'AI/ML' },
  { name: 'Prof. Bob Jenkins', interns: 6, expertise: 'Web Dev' },
  { name: 'Clara Oswald', interns: 5, expertise: 'Data Science' },
  { name: 'David Miller', interns: 7, expertise: 'Backend' },
  { name: 'Emily Watson', interns: 6, expertise: 'Frontend' },
  { name: 'Frank Wright', interns: 4, expertise: 'Fullstack' }
];

const DepartmentAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [deptStats, setDeptStats] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [summary, setSummary] = useState({
    totalDepts: 0,
    totalMentors: 0,
    platformAvgScore: 0,
    topDept: ''
  });

  useEffect(() => {
    const loadAdminAnalytics = async () => {
      setLoading(true);
      try {
        // Query server endpoints to get live database records
        const [internsRes] = await Promise.all([
          api.get('/analytics/interns').catch(() => ({ data: { items: [] } }))
        ]);

        await new Promise(r => setTimeout(r, 700));

        // Group the live interns count if available
        const liveInterns = internsRes.data.items || [];
        
        let deptData = [...MOCK_DEPT_SUMMARY];
        if (liveInterns.length > 0) {
          // Adjust mock data according to actual DB user count dynamically
          const deptsList = ['AI/ML', 'Web Dev', 'Data Science', 'Backend', 'Frontend'];
          deptData = deptsList.map(d => {
            const matches = liveInterns.filter(i => i.department === d);
            const count = matches.length;
            const avgSc = count > 0 ? (matches.reduce((sum, i) => sum + i.avgScore, 0) / count) : 8.5;
            const completed = count > 0 ? matches.reduce((sum, i) => sum + i.completedTasks, 0) : 100;
            const att = count > 0 ? Math.round(matches.reduce((sum, i) => sum + i.attendanceRate, 0) / count) : 95;
            return {
              name: d,
              interns: count || 5, // fallback if 0
              avgScore: Number(avgSc.toFixed(1)),
              tasksCompleted: completed || 50,
              attendance: att || 92,
              completionRate: Math.round(att * 0.85) // rough approximation
            };
          });
        }

        setDeptStats(deptData);
        setMentors(MOCK_MENTORS_WORKLOAD);

        const totalMentors = MOCK_MENTORS_WORKLOAD.length;
        const avgScorePlatform = Number((deptData.reduce((acc, curr) => acc + curr.avgScore, 0) / deptData.length).toFixed(2));
        const highestScoring = [...deptData].sort((a, b) => b.avgScore - a.avgScore)[0].name;

        setSummary({
          totalDepts: deptData.length,
          totalMentors,
          platformAvgScore: avgScorePlatform,
          topDept: highestScoring
        });
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };

    loadAdminAnalytics();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <SectionHeader 
        title="Department & Mentor Analytics" 
        subtitle="Consolidated platform metrics, department performance evaluations, and mentor workloads" 
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="animate-spin text-[var(--brand-orange)]" size={28} />
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Active Departments" value={summary.totalDepts} icon={Building2} color="#ff6d34" />
            <StatCard title="Platform Avg Score" value={`${summary.platformAvgScore}/10`} icon={Star} color="#00bea3" />
            <StatCard title="Total Mentors" value={summary.totalMentors} icon={Briefcase} color="#7C3AED" />
            <StatCard title="Top Department" value={summary.topDept} icon={Award} color="#f59e0b" subtitle="Best Performance" />
          </div>

          {/* Graphical Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Dept Performance (Avg Score & Tasks completed) */}
            <Card className="p-5 border border-[var(--border)]">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Department Performance Evaluation</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={deptStats}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 11, background: 'var(--card)', color: 'var(--text)' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" name="Avg Score" dataKey="avgScore" fill="#00bea3" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" name="Tasks Completed" dataKey="tasksCompleted" fill="#ff6d34" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Mentor Workload Distribution */}
            <Card className="p-5 border border-[var(--border)]">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Mentor Workload (Assigned Interns)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={mentors} 
                    dataKey="interns" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50}
                    outerRadius={80} 
                    paddingAngle={3}
                  >
                    {mentors.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 11, background: 'var(--card)', color: 'var(--text)' }} />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle" 
                    wrapperStyle={{ fontSize: 10, paddingLeft: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Intern Distribution & Completion rates */}
            <Card className="p-5 border border-[var(--border)]">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Interns Count vs completion Rate</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={deptStats} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 11, background: 'var(--card)', color: 'var(--text)' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar name="Intern Count" dataKey="interns" fill="#7C3AED" radius={[0, 4, 4, 0]} />
                  <Bar name="Completion Rate (%)" dataKey="completionRate" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Attendance Comparison */}
            <Card className="p-5 border border-[var(--border)]">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Department Attendance Rate</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={deptStats}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 11, background: 'var(--card)', color: 'var(--text)' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" name="Attendance %" dataKey="attendance" stroke="#06b6d4" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

          </div>

          {/* Consolidated Summary Table */}
          <Card className="p-5 overflow-hidden border border-[var(--border)]">
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Department Overview Summary</h3>
            <div className="sn-table-scroll -mx-1">
              <table className="w-full text-sm min-w-[42rem]">
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>Department</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--muted)' }}>Total Interns</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--muted)' }}>Avg Perf Score</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--muted)' }}>Completed Tasks</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--muted)' }}>Attendance Rate</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--muted)' }}>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {deptStats.map((dept) => (
                    <tr key={dept.name} className="hover:bg-[var(--hover-overlay)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3 font-semibold text-[var(--text)]">{dept.name}</td>
                      <td className="px-4 py-3 text-center font-medium">{dept.interns}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={dept.avgScore >= 8.5 ? 'success' : 'default'}>
                          ⭐ {dept.avgScore}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{dept.tasksCompleted}</td>
                      <td className="px-4 py-3 text-center">{dept.attendance}%</td>
                      <td className="px-4 py-3 text-right text-emerald-500 font-bold">{dept.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default DepartmentAnalytics;
