// ══════════════════════════════════════════════
//  USER — pages/Analytics.jsx  (Redesigned)
// ══════════════════════════════════════════════

import { motion } from "framer-motion";
const MotionDiv = motion.div;
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { CheckCircle, Clock, Award, TrendingUp, Target, Zap } from "lucide-react";
import { Card, StatCard, SectionHeader } from "../../shared/components/UI";
import { ACTIVITY_DATA, SKILL_DATA, CHART_COLORS } from "../../shared/utils/constants";

const CHART_C = ["#ff6d34", "#00bea3", "#7c3aed", "#2563eb", "#f59e0b"];

const TASK_PROGRESS = [
  { task: "Research",      completion: 80 },
  { task: "Coding",        completion: 65 },
  { task: "Documentation", completion: 40 },
  { task: "Testing",       completion: 55 },
  { task: "Design",        completion: 72 },
];

const MONTHLY_DATA = [
  { month: "Jan", hours: 20, tasks: 12 },
  { month: "Feb", hours: 35, tasks: 18 },
  { month: "Mar", hours: 28, tasks: 15 },
  { month: "Apr", hours: 42, tasks: 24 },
  { month: "May", hours: 38, tasks: 22 },
  { month: "Jun", hours: 50, tasks: 28 },
];

const PERFORMANCE_SCORE = [{ name: "Score", value: 82, fill: "#ff6d34" }];

const STRENGTHS = [
  { label: "Problem Solving", score: 92 },
  { label: "Communication",   score: 78 },
  { label: "Time Management", score: 85 },
  { label: "Technical Skills", score: 88 },
  { label: "Team Collaboration", score: 90 },
];

const Analytics = () => (
  <div className="space-y-6">

    {/* ── Hero Banner ─────────────────────────────── */}
    <MotionDiv
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden shadow-lg"
      style={{ background: "linear-gradient(135deg, #2D3436 0%, #1a1f20 60%, #2D3436 100%)" }}
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, #ff6d34 1px, transparent 1px), radial-gradient(circle at 80% 20%, #00bea3 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #ff6d34, #00bea3)" }} />

      <div className="relative p-4 sm:p-7">
        <p className="text-sm font-medium" style={{ color: "#00bea3" }}>Performance Overview</p>
        <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">My Analytics Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "#9ca3af" }}>Track your internship progress, performance trends, and skill development.</p>
        <div className="flex gap-3 mt-5 flex-wrap">
          {[["82%", "Performance"], ["50h", "This Month"], ["28", "Tasks Done"], ["4.5", "Avg Rating"]].map(([v, l]) => (
            <div
              key={l}
              className="rounded-xl px-4 py-2.5 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ background: "rgba(255,109,52,0.15)", border: "1px solid rgba(255,109,52,0.3)" }}
            >
              <p className="font-bold text-lg leading-none text-white">{v}</p>
              <p className="text-xs mt-1" style={{ color: "#ff6d34" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </MotionDiv>

    {/* ── Stat Cards ──────────────────────────────── */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Tasks Completed" value="28"     icon={CheckCircle}  color="#00bea3" trend="+5 this week"   delay={0.1} />
      <StatCard title="Learning Hours"  value="50 hrs" icon={Clock}        color="#ff6d34" trend="+12 hrs"       delay={0.2} />
      <StatCard title="Performance"     value="82%"    icon={Award}        color="#7c3aed" trend="↑ 4% vs last"  delay={0.3} />
      <StatCard title="Streak"          value="12 days" icon={Zap}         color="#f59e0b" subtitle="Keep going!" delay={0.4} />
    </div>

    {/* ── Charts Row 1 ────────────────────────────── */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

      {/* Monthly Trend - Area */}
      <Card className="p-5 lg:col-span-3" delay={0.5}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Monthly Performance Trend</h3>
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#ff6d34" }} /> Hours</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#00bea3" }} /> Tasks</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={MONTHLY_DATA}>
            <defs>
              <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ff6d34" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ff6d34" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="tasksGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00bea3" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00bea3" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
            <Area type="monotone" dataKey="hours" stroke="#ff6d34" fill="url(#hoursGrad)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="tasks" stroke="#00bea3" fill="url(#tasksGrad)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Performance Gauge */}
      <Card className="p-5 lg:col-span-2 flex flex-col items-center justify-center" delay={0.6}>
        <h3 className="text-sm font-semibold mb-2 self-start" style={{ color: "var(--text)" }}>Overall Score</h3>
        <ResponsiveContainer width="100%" height={160}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={PERFORMANCE_SCORE} barSize={12}>
            <RadialBar background={{ fill: "var(--border)" }} dataKey="value" cornerRadius={6} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="text-center -mt-8">
          <p className="text-3xl font-bold" style={{ color: "#ff6d34" }}>82%</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Performance Score</p>
        </div>
      </Card>
    </div>

    {/* ── Charts Row 2 ────────────────────────────── */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Skill Distribution Donut */}
      <Card className="p-5" delay={0.7}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Skill Learning Distribution</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ResponsiveContainer width="55%" height={180}>
            <PieChart>
              <Pie data={SKILL_DATA} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45} paddingAngle={3}>
                {SKILL_DATA.map((_, i) => <Cell key={i} fill={CHART_C[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 flex-1">
            {SKILL_DATA.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_C[i] }} />
                    <span style={{ color: "var(--text)" }}>{s.name}</span>
                  </span>
                  <span className="font-bold" style={{ color: "var(--text)" }}>{s.value}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, background: CHART_C[i] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Task Progress Bar Chart */}
      <Card className="p-5" delay={0.8}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Task Progress by Category</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={TASK_PROGRESS} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="task" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }}
              formatter={v => [`${v}%`, "Completion"]}
            />
            <Bar dataKey="completion" radius={[0, 6, 6, 0]} barSize={16}>
              {TASK_PROGRESS.map((_, i) => <Cell key={i} fill={CHART_C[i % CHART_C.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* ── Strengths ───────────────────────────────── */}
    <Card className="p-5" delay={0.9}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Key Strengths & Competencies</h3>
        <div className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(0,190,163,0.12)", color: "#00bea3" }}>
          <Target size={12} /> Based on 28 assessments
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STRENGTHS.map((s, i) => (
          <div key={i} className="text-center p-4 rounded-xl transition-all hover:-translate-y-1" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="relative w-14 h-14 mx-auto mb-3">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke={CHART_C[i % CHART_C.length]}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(s.score / 100) * 150.8} 150.8`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: "var(--text)" }}>
                {s.score}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </Card>

    {/* ── Weekly Activity ─────────────────────────── */}
    <Card className="p-5" delay={1.0}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Weekly Learning Activity</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={ACTIVITY_DATA}>
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={32}>
            {ACTIVITY_DATA.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#ff6d34" : "#00bea3"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>

  </div>
);

export default Analytics;