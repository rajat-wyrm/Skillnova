// ══════════════════════════════════════════════
//  USER — pages/Dashboard.jsx  (UptoSkills Branded)
//  Refactored: all data fetched from dashboardApi
//  via getUserDashboardData(). No hardcoded arrays
//  (PENDING_TASKS, RECENT_ACTIVITY, ACTIVITY_DATA,
//  SKILL_DATA, banner stats) remain.
// ══════════════════════════════════════════════

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
const MotionDiv = motion.div;
import {
  CheckCircle, ClipboardList, CalendarCheck, TrendingUp, MessageSquare,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, StatCard } from "../../shared/components/UI";
import { ErrorState, EmptyState } from "../../shared/components/AppState";
import { UserDashboardSkeleton } from "../../shared/components/PageSkeletons";
import { getUserDashboardData } from "../../shared/services/api/dashboardApi";

const CHART_C = ["#ff6d34", "#00bea3", "#2D3436", "#f97316", "#06b6d4"];

// ── Icon map for recent-activity items ─────────────────────────
const ACTIVITY_ICON_MAP = {
  report:       "📄",
  announcement: "📢",
  article:      "📚",
  task:         "✅",
  meeting:      "📅",
};

const resolveActivityIcon = item => {
  if (item.icon) return item.icon;
  const type = String(item.type || "").toLowerCase();
  return ACTIVITY_ICON_MAP[type] || "🔔";
};

// ── Priority dot colour ─────────────────────────────────────────
const priorityColor = priority => {
  const p = String(priority || "").toLowerCase();
  if (p === "high")   return "#ff6d34";
  if (p === "medium") return "#f59e0b";
  return "#d1d5db";
};

// ── Due badge style ─────────────────────────────────────────────
const dueBadgeStyle = due => {
  const d = String(due || "").toLowerCase();
  return {
    background: d === "today" ? "rgba(255,109,52,0.15)" : "rgba(148,163,184,0.15)",
    color:      d === "today" ? "#ff6d34" : "var(--muted)",
  };
};

// ── Loading skeleton ────────────────────────────────────────────
const DashboardSkeleton = UserDashboardSkeleton;

// ══════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════
const Dashboard = ({ onNavigate }) => {
  const [pageState, setPageState] = useState("loading");
  const [error, setError]         = useState("");
  const [data, setData]           = useState(null);

  const fetchDashboard = async () => {
    return getUserDashboardData();
  };

  useEffect(() => {
    let isActive = true;

    const initializeDashboard = async () => {
      try {
        const result = await fetchDashboard();
        if (!isActive) return;
        setData(result);
        setPageState("ready");
      } catch (err) {
        if (!isActive) return;
        setError(err.message || "Unable to load dashboard.");
        setPageState("error");
      }
    };

    initializeDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const handleRetry = async () => {
    setPageState("loading");
    setError("");
    try {
      const result = await fetchDashboard();
      setData(result);
      setPageState("ready");
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
      setPageState("error");
    }
  };

  // ── Loading state ──
  if (pageState === "loading") return <DashboardSkeleton />;

  // ── Error state ──
  if (pageState === "error") {
    return (
      <ErrorState
        title="Could not load dashboard"
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

  // ── Empty state ──
  if (!data) {
    return (
      <EmptyState
        title="No dashboard data yet"
        description="Complete some tasks or submit a report to see your stats here."
      />
    );
  }

  const {
    profile,
    heroDate,
    heroSummary,
    heroChips,
    statCards,
    chartActivity,
    skillDistribution,
    recentActivity,
    pendingTasks,
  } = data;

  // Derive stat card icons (order matches dashboardApi's statCards array)
  const STAT_ICONS = [ClipboardList, CheckCircle, CalendarCheck, TrendingUp];

  // Build chart-compatible activity data
  const activityChartData = chartActivity.map(item => ({
    day:   item.label ?? item.day,
    hours: item.value ?? item.hours ?? 0,
  }));

  // Build chart-compatible skill data
  const skillChartData = skillDistribution.map(s => ({
    name:  s.name  ?? s.label,
    value: s.value ?? s.percentage ?? 0,
  }));

  return (
    <div className="space-y-6 relative pb-16">

      {/* ── Welcome Banner ──────────────────────────── */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-xl overflow-hidden shadow-lg"
        style={{ background: "linear-gradient(135deg, #2D3436 0%, #1a1f20 60%, #2D3436 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #ff6d34, #00bea3)" }} />

        <div className="relative p-7 sm:p-10">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color: "#00bea3" }}>
            {heroDate}
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            Good morning,<br className="sm:hidden" /> {profile?.name?.split(" ")[0] || "there"}! 👋
          </h1>
          <p className="mt-4 text-sm sm:text-base font-medium text-slate-400 max-w-lg leading-relaxed">
            You have{" "}
            <span className="text-white font-bold">{heroSummary.pendingTasks} pending tasks</span>{" "}
            and {heroSummary.unreadAnnouncements} unread announcement{heroSummary.unreadAnnouncements !== 1 ? "s" : ""}
          </p>

          {/* Hero chips — dynamic from API */}
          <div className="flex gap-3 mt-5 flex-wrap">
            {heroChips.map(({ value, label }) => (
              <div
                key={label}
                className="bg-white/5 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 transition-all hover:bg-white/10 hover:-translate-y-1"
              >
                <p className="font-black text-xl text-white">{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "#ff6d34" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </MotionDiv>

      {/* ── Stat Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={STAT_ICONS[i] || ClipboardList}
            color={card.color}
            trend={card.trend}
            subtitle={card.subtitle}
            delay={(i + 1) * 0.1}
          />
        ))}
      </div>

      {/* ── Charts Row ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Area chart — weekly learning activity */}
        <Card className="p-5 lg:col-span-3" delay={0.5}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Weekly Learning Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityChartData}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff6d34" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ff6d34" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis               tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
              <Area type="monotone" dataKey="hours" stroke="#ff6d34" fill="url(#actGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie chart — skill distribution */}
        <Card className="p-5 lg:col-span-2" delay={0.6}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Skill Distribution</h3>
          {skillChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={skillChartData} dataKey="value" nameKey="name" outerRadius={65} innerRadius={35} paddingAngle={3}>
                    {skillChartData.map((_, i) => <Cell key={i} fill={CHART_C[i % CHART_C.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {skillChartData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_C[i % CHART_C.length] }} />
                      <span style={{ color: "var(--muted)" }}>{s.name}</span>
                    </div>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: "var(--muted)" }}>No skill data yet</p>
          )}
        </Card>
      </div>

      {/* ── Bottom Row ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Activity */}
        <Card className="p-5" delay={0.7}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted)" }}>No recent activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <span className="text-base">{resolveActivityIcon(a)}</span>
                  <p className="text-sm flex-1" style={{ color: "var(--text)" }}>{a.text}</p>
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Tasks */}
        <Card className="p-5" delay={0.8}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Pending Tasks</h3>
          {pendingTasks.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted)" }}>No pending tasks. Great job! 🎉</p>
          ) : (
            <div className="space-y-1">
              {pendingTasks.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition"
                  onMouseEnter={e => e.currentTarget.style.background = document.documentElement.classList.contains("dark") ? "rgba(255,255,255,0.04)" : "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: priorityColor(t.priority) }}
                  />
                  <p className="text-sm flex-1" style={{ color: "var(--text)" }}>
                    {t.title ?? t.task ?? "Task"}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={dueBadgeStyle(t.due)}
                  >
                    {t.due ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Floating QnA Button ──────────────────────── */}
      {onNavigate && (
        <button
          onClick={() => onNavigate("qa")}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-110 transition-transform duration-300 z-50 group"
          style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
          title="Q&A Forum"
        >
          <MessageSquare className="text-white w-6 h-6" />
          <span
            className="absolute right-full mr-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none"
          >
            Q&A Forum
          </span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;


