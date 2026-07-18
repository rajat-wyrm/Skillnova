// ══════════════════════════════════════════════
//  ADMIN — pages/Dashboard.jsx  (UptoSkills Branded)
// ══════════════════════════════════════════════

import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FileText, CalendarCheck, HelpCircle, AlertCircle, Star, Shield,
} from "lucide-react";
import { Card, StatCard } from "../../shared/components/UI";
import { ACTIVITY_DATA } from "../../shared/utils/constants";

const WEEK_DATA = [
  { day: "Mon", reports: 3, logins: 8  },
  { day: "Tue", reports: 5, logins: 12 },
  { day: "Wed", reports: 2, logins: 6  },
  { day: "Thu", reports: 7, logins: 15 },
  { day: "Fri", reports: 6, logins: 11 },
];

const RECENT_ACTIONS = [
  { action: "Report approved",    detail: "Week 1 – Rahul Sharma",  time: "5m",  color: "orange" },
  { action: "New intern added",   detail: "Sneha Reddy · Backend",  time: "1h",  color: "green"  },
  { action: "Article verified",   detail: "ML Best Practices",      time: "2h",  color: "green"  },
  { action: "Announcement posted",detail: "Weekly meeting reminder", time: "3h",  color: "orange" },
  { action: "User role changed",  detail: "Amit Verma → Admin",      time: "5h",  color: "dark"   },
];

const AdminDashboard = () => (
  <div className="space-y-6">

    {/* ── Hero Banner ─────────────────────────────── */}
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a1f20 0%, #2D3436 100%)" }}
    >
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #ff6d34, #00bea3)" }} />

      <div className="relative p-4 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium mb-1" style={{ color: "#ff6d34" }}>Admin Overview · March 2026</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Platform Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
              Monitor interns, knowledge base and platform activity
            </p>
          </div>
          <div
            className="rounded-xl p-3 self-start"
            style={{ background: "rgba(255,109,52,0.15)", border: "1px solid rgba(255,109,52,0.3)" }}
          >
            <Shield size={26} style={{ color: "#ff6d34" }} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            ["24", "Total Interns",     "+3"],
            ["18", "Active Users",      "+1"],
            ["12", "Reports This Week", "+4"],
            ["48", "KB Articles",       "+6"],
          ].map(([v, l, c]) => (
            <div
              key={l}
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <p className="text-xl font-bold text-white">{v}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{l}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "#00bea3" }}>{c} this week</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ── Stat Cards ──────────────────────────────── */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Pending Reviews" value="6"      icon={AlertCircle}  color="#ff6d34" />
      <StatCard title="Avg Score"       value="7.8/10" icon={Star}         color="#00bea3" />
      <StatCard title="Attendance Rate" value="88%"    icon={CalendarCheck}color="#00bea3" />
      <StatCard title="Open Questions"  value="14"     icon={HelpCircle}   color="#ff6d34" />
    </div>

    {/* ── Charts ──────────────────────────────────── */}
    <div className="grid lg:grid-cols-3 gap-4">

      <Card className="p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "#2D3436" }}>Weekly Platform Activity</h3>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={WEEK_DATA} barGap={4}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis               tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
            <Bar dataKey="logins"  fill="#ff6d34" radius={[3, 3, 0, 0]} name="Logins"  />
            <Bar dataKey="reports" fill="#00bea3" radius={[3, 3, 0, 0]} name="Reports" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          {[["#ff6d34", "Logins"], ["#00bea3", "Reports"]].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5 text-xs" style={{ color: "#6b7280" }}>
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} /> {l}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "#2D3436" }}>Recent Actions</h3>
        <div className="space-y-3">
          {RECENT_ACTIONS.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: a.color === "orange" ? "#ff6d34" : a.color === "green" ? "#00bea3" : "#2D3436" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: "#374151" }}>{a.action}</p>
                <p className="text-xs truncate" style={{ color: "#9ca3af" }}>{a.detail}</p>
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: "#9ca3af" }}>{a.time} ago</span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* ── Area Chart ──────────────────────────────── */}
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#2D3436" }}>Platform Usage Trend (hrs)</h3>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={ACTIVITY_DATA}>
          <defs>
            <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00bea3" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#00bea3" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis               tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
          <Area type="monotone" dataKey="hours" stroke="#00bea3" fill="url(#adminGrad)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>

  </div>
);

export default AdminDashboard;