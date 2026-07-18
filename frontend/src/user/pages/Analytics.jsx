// ══════════════════════════════════════════════
//  USER — pages/Analytics.jsx
//  Refactored: all data (TASK_PROGRESS, MONTHLY_DATA,
//  PERFORMANCE_SCORE, STRENGTHS, ACTIVITY_DATA,
//  SKILL_DATA, hero stats) fetched from analyticsApi
//  via getUserAnalyticsData(). No hardcoded arrays.
// ══════════════════════════════════════════════

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
const MotionDiv = motion.div;
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { CheckCircle, Clock, Award, Zap, Target } from "lucide-react";
import { Card, StatCard } from "../../shared/components/UI";
import { ErrorState, EmptyState } from "../../shared/components/AppState";
import { UserAnalyticsSkeleton } from "../../shared/components/PageSkeletons";
import { getUserAnalyticsData } from "../../shared/services/api/analyticsApi";

const CHART_C = ["#ff6d34", "#00bea3", "#7c3aed", "#2563eb", "#f59e0b"];

// Icon set for stat cards — order matches analyticsApi statCards array
const STAT_ICONS = [CheckCircle, Clock, Award, Zap];

// ── Loading skeleton ────────────────────────────────────────────
const AnalyticsSkeleton = UserAnalyticsSkeleton;

// ══════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════
const Analytics = () => {
  const [pageState, setPageState] = useState("loading");
  const [error, setError]         = useState("");
  const [data, setData]           = useState(null);

  const fetchAnalytics = async () => {
    return getUserAnalyticsData();
  };

  useEffect(() => {
    let isActive = true;

    const initializeAnalytics = async () => {
      try {
        const result = await fetchAnalytics();
        if (!isActive) return;
        setData(result);
        setPageState("ready");
      } catch (err) {
        if (!isActive) return;
        setError(err.message || "Unable to load analytics.");
        setPageState("error");
      }
    };

    initializeAnalytics();

    return () => {
      isActive = false;
    };
  }, []);

  const handleRetry = async () => {
    setPageState("loading");
    setError("");
    try {
      const result = await fetchAnalytics();
      setData(result);
      setPageState("ready");
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
      setPageState("error");
    }
  };

  // ── Loading ──
  if (pageState === "loading") return <AnalyticsSkeleton />;

  // ── Error ──
  if (pageState === "error") {
    return (
      <ErrorState
        title="Could not load analytics"
        description={error}
        action={
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "#ff6d34" }}
          >
            Retry
          </button>
        }
      />
    );
  }

  // ── Empty ──
  if (!data) {
    return (
      <EmptyState
        title="No analytics data yet"
        description="Submit reports and complete tasks to see your performance analytics."
      />
    );
  }

  const {
    heroChips,
    statCards,
    monthlyTrend,
    performanceScore,
    skillDistribution,
    taskProgress,
    strengths,
    weeklyActivity,
  } = data;

  // Normalise shapes from the API into what the charts expect
  const monthlyChartData = monthlyTrend.map(item => ({
    month:  item.month  ?? item.label,
    hours:  item.activity ?? item.hours ?? 0,
    tasks:  item.tasks  ?? 0,
  }));

  const performanceGauge = [{ name: "Score", value: performanceScore, fill: "#ff6d34" }];

  const skillChartData = skillDistribution.map(s => ({
    name:  s.name  ?? s.label,
    value: s.value ?? s.percentage ?? 0,
  }));

  const taskChartData = taskProgress.map(t => ({
    task:       t.label ?? t.task,
    completion: t.value ?? t.completion ?? 0,
  }));

  const activityChartData = weeklyActivity.map(item => ({
    day:   item.day   ?? item.label,
    hours: item.activity ?? item.hours ?? 0,
  }));

  return (
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

          {/* Hero chips — dynamic from API */}
          <div className="flex gap-3 mt-5 flex-wrap">
            {heroChips.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl px-4 py-2.5 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ background: "rgba(255,109,52,0.15)", border: "1px solid rgba(255,109,52,0.3)" }}
              >
                <p className="font-bold text-lg leading-none text-white">{value}</p>
                <p className="text-xs mt-1" style={{ color: "#ff6d34" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </MotionDiv>

      {/* ── Stat Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={STAT_ICONS[i] || CheckCircle}
            color={card.color}
            trend={card.trend}
            subtitle={card.subtitle}
            delay={(i + 1) * 0.1}
          />
        ))}
      </div>

      {/* ── Charts Row 1 ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Monthly Trend — Area */}
        <Card className="p-5 lg:col-span-3" delay={0.5}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Monthly Performance Trend</h3>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#ff6d34" }} /> Hours</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#00bea3" }} /> Tasks</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyChartData}>
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
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={performanceGauge} barSize={12}>
              <RadialBar background={{ fill: "var(--border)" }} dataKey="value" cornerRadius={6} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-8">
            <p className="text-3xl font-bold" style={{ color: "#ff6d34" }}>{performanceScore}%</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Performance Score</p>
          </div>
        </Card>
      </div>

      {/* ── Charts Row 2 ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Skill Distribution Donut */}
        <Card className="p-5" delay={0.7}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Skill Learning Distribution</h3>
          {skillChartData.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: "var(--muted)" }}>No skill data yet.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={skillChartData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45} paddingAngle={3}>
                    {skillChartData.map((_, i) => <Cell key={i} fill={CHART_C[i % CHART_C.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {skillChartData.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_C[i % CHART_C.length] }} />
                        <span style={{ color: "var(--text)" }}>{s.name}</span>
                      </span>
                      <span className="font-bold" style={{ color: "var(--text)" }}>{s.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, background: CHART_C[i % CHART_C.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Task Progress Bar Chart */}
        <Card className="p-5" delay={0.8}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Task Progress by Category</h3>
          {taskChartData.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: "var(--muted)" }}>No task data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={taskChartData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="task" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }}
                  formatter={v => [`${v}%`, "Completion"]}
                />
                <Bar dataKey="completion" radius={[0, 6, 6, 0]} barSize={16}>
                  {taskChartData.map((_, i) => <Cell key={i} fill={CHART_C[i % CHART_C.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Strengths ───────────────────────────────── */}
      <Card className="p-5" delay={0.9}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Key Strengths & Competencies</h3>
          <div className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(0,190,163,0.12)", color: "#00bea3" }}>
            <Target size={12} /> Based on {strengths.length} assessments
          </div>
        </div>
        {strengths.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--muted)" }}>No strengths data yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {strengths.map((s, i) => {
              const score = s.score ?? s.value ?? 0;
              const label = s.label ?? s.name ?? s.skill ?? "";
              const circumference = 150.8;
              const dashLength = (score / 100) * circumference;
              return (
                <div
                  key={i}
                  className="text-center p-4 rounded-xl transition-all hover:-translate-y-1"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <div className="relative w-14 h-14 mx-auto mb-3">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border)" strokeWidth="4" />
                      <circle
                        cx="28" cy="28" r="24" fill="none"
                        stroke={CHART_C[i % CHART_C.length]}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${dashLength} ${circumference}`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: "var(--text)" }}>
                      {score}
                    </span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: "var(--text)" }}>{label}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Weekly Activity ─────────────────────────── */}
      <Card className="p-5" delay={1.0}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Weekly Learning Activity</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={activityChartData}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={32}>
              {activityChartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#ff6d34" : "#00bea3"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

    </div>
  );
};

export default Analytics;



