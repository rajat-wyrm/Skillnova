// ══════════════════════════════════════════════
//  USER — pages/Dashboard.jsx  (UptoSkills Branded)
// ══════════════════════════════════════════════

import { motion } from "framer-motion";
const MotionDiv = motion.div;
import {
  CheckCircle, ClipboardList, CalendarCheck, TrendingUp, MessageSquare
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, StatCard } from "../../shared/components/UI";
import { ACTIVITY_DATA, SKILL_DATA, COLORS } from "../../shared/utils/constants";

import { useState, useEffect } from "react";
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const CHART_C = ["#ff6d34", "#00bea3", "#2D3436", "#f97316", "#06b6d4"];

const PENDING_TASKS = [
  { title: "Complete Data Preprocessing",  priority: "High",   due: "Today"     },
  { title: "Submit Weekly Report",         priority: "High",   due: "Fri"       },
  { title: "Review ML Documentation",      priority: "Medium", due: "Next week" },
  { title: "Update LinkedIn Profile",      priority: "Low",    due: "Anytime"   },
];

const RECENT_ACTIVITY = [
  { icon: "✅", text: "Completed Machine Learning task",      time: "2h ago" },
  { icon: "📄", text: "Submitted weekly internship report",   time: "1d ago" },
  { icon: "📅", text: "Attended AI/ML team meeting",          time: "2d ago" },
  { icon: "📚", text: "Viewed new knowledge base article",    time: "3d ago" },
];

const Dashboard = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const SkeletonWrapper = ({ children }) => (
    <SkeletonTheme baseColor="var(--skeleton-base)" highlightColor="var(--skeleton-highlight)">
      {children}
    </SkeletonTheme>
  );

  if (loading) {
    return (
      <SkeletonWrapper>
        <div className="space-y-6">
          {/* Banner Skeleton */}
          <div className="rounded-xl h-48 bg-slate-100 animate-pulse border border-slate-200" />
          
          {/* Stat Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Skeleton height={14} width="60%" />
                <Skeleton height={28} width="40%" className="mt-2" />
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
                  <Skeleton circle height={12} width={12} />
                  <Skeleton height={10} width="30%" />
                </div>
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-100 lg:col-span-3">
              <Skeleton height={14} width="120px" className="mb-4" />
              <Skeleton height={180} />
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-100 lg:col-span-2">
              <Skeleton height={14} width="100px" className="mb-3" />
              <div className="flex justify-center my-4">
                <Skeleton circle height={110} width={110} />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} height={10} />)}
              </div>
            </div>
          </div>
        </div>
      </SkeletonWrapper>
    );
  }

  return (
  <div className="space-y-6 relative pb-16">

    {/* ── Welcome Banner ─────────────────────────────── */}
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
          backgroundSize: "24px 24px"
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #ff6d34, #00bea3)" }} />

      <div className="relative p-7 sm:p-10">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color: "#00bea3" }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">Good morning,<br className="sm:hidden" /> Rahul! 👋</h1>
        <p className="mt-4 text-sm sm:text-base font-medium text-slate-400 max-w-lg leading-relaxed">
          You have <span className="text-white font-bold">4 pending tasks</span> and 1 unread announcement
        </p>
          {[["08", "Tasks Done"], ["92%", "Attendance"], ["8.5", "Score"]].map(([v, l]) => (
            <div
              key={l}
              className="bg-white/5 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 transition-all hover:bg-white/10 hover:-translate-y-1"
            >
              <p className="font-black text-xl text-white">{v}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "#ff6d34" }}>{l}</p>
            </div>
          ))}
        </div>
      </MotionDiv>

    {/* ── Stat Cards ──────────────────────────────────── */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Assigned Tasks"  value="12"     icon={ClipboardList} color="#ff6d34" trend="15%" delay={0.1} />
      <StatCard title="Completed"       value="8"      icon={CheckCircle}   color="#00bea3" trend="12%"     delay={0.2} />
      <StatCard title="Attendance"      value="92%"    icon={CalendarCheck} color="#ff6d34" subtitle="18/20 days" delay={0.3} />
      <StatCard title="Performance"     value="8.5/10" icon={TrendingUp}    color="#00bea3" trend="5.4%"    delay={0.4} />
    </div>

    {/* ── Charts Row ──────────────────────────────────── */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

      {/* Area chart */}
      <Card className="p-5 lg:col-span-3" delay={0.5}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Weekly Learning Activity</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={ACTIVITY_DATA}>
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

      {/* Pie chart */}
      <Card className="p-5 lg:col-span-2" delay={0.6}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Skill Distribution</h3>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie data={SKILL_DATA} dataKey="value" nameKey="name" outerRadius={65} innerRadius={35} paddingAngle={3}>
              {SKILL_DATA.map((_, i) => <Cell key={i} fill={CHART_C[i]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5 mt-2">
          {SKILL_DATA.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_C[i] }} />
                <span style={{ color: "var(--muted)" }}>{s.name}</span>
              </div>
              <span className="font-semibold" style={{ color: "var(--text)" }}>{s.value}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* ── Bottom Row ──────────────────────────────────── */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Recent Activity */}
      <Card className="p-5" delay={0.7}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Recent Activity</h3>
        <div className="space-y-3">
          {RECENT_ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < RECENT_ACTIVITY.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span className="text-base">{a.icon}</span>
              <p className="text-sm flex-1" style={{ color: "var(--text)" }}>{a.text}</p>
              <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>{a.time}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending Tasks */}
      <Card className="p-5" delay={0.8}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Pending Tasks</h3>
        <div className="space-y-1">
          {PENDING_TASKS.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition"
              onMouseEnter={e => e.currentTarget.style.background = document.documentElement.classList.contains("dark") ? "rgba(255,255,255,0.04)" : "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: t.priority === "High" ? "#ff6d34" : t.priority === "Medium" ? "#f59e0b" : "#d1d5db" }}
              />
              <p className="text-sm flex-1" style={{ color: "var(--text)" }}>{t.title}</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: t.due === "Today" ? "rgba(255,109,52,0.15)" : "rgba(148,163,184,0.15)",
                  color: t.due === "Today" ? "#ff6d34" : "var(--muted)",
                }}
              >
                {t.due}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* ── Floating QnA Button ──────────────────────────── */}
    {onNavigate && (
      <button
        onClick={() => onNavigate("qa")}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-110 transition-transform duration-300 z-50 group"
        style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }} // WhatsApp green vibe
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