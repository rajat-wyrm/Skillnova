// ══════════════════════════════════════════════
//  ADMIN — pages/Analytics.jsx
// ══════════════════════════════════════════════

import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { FileText, TrendingUp, BookOpen, MessageSquare } from "lucide-react";
import { Card, StatCard, SectionHeader } from "../../shared/components/UI";
import { COLORS, CHART_COLORS, ACTIVITY_DATA, MOCK_INTERNS } from "../../shared/utils/constants";

const INTERN_PERF = MOCK_INTERNS.map(i => ({
  name:  i.name.split(" ")[0],
  score: i.rating,
  tasks: [12, 15, 9, 13][i.id - 1] ?? 10,
}));

const DEPT_DATA = [
  { name: "AI/ML",        value: 8  },
  { name: "Web Dev",      value: 6  },
  { name: "Data Science", value: 5  },
  { name: "Backend",      value: 5  },
];

const WEEKLY_REPORTS = [
  { week: "W1", submitted: 8,  reviewed: 6  },
  { week: "W2", submitted: 10, reviewed: 9  },
  { week: "W3", submitted: 7,  reviewed: 7  },
  { week: "W4", submitted: 12, reviewed: 10 },
];

const Analytics = () => (
  <div className="space-y-6">

    <SectionHeader
      title="Platform Analytics"
      subtitle="Insights across all interns, reports and platform activity"
    />

    {/* Stat Row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Reports"     value="48"  icon={FileText}     color={COLORS.primary} trend="+12 this month" />
      <StatCard title="Avg Performance"   value="7.8/10" icon={TrendingUp} color={COLORS.accent}  trend="↑ 0.2 pts"    />
      <StatCard title="KB Articles"       value="24"  icon={BookOpen}     color={COLORS.success} trend="+6 this month" />
      <StatCard title="Questions Answered"value="86%" icon={MessageSquare}color={COLORS.warning} trend="↑ 4%"          />
    </div>

    {/* Charts Grid */}
    <div className="grid lg:grid-cols-2 gap-4">

      {/* Intern performance scores */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Intern Performance Scores</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={INTERN_PERF}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }}
              formatter={v => [`${v}/10`, "Score"]}
            />
            <Bar dataKey="score" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Department distribution */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Interns by Department</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={DEPT_DATA}
              dataKey="value"
              nameKey="name"
              outerRadius={75}
              innerRadius={40}
              paddingAngle={3}
            >
              {DEPT_DATA.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {DEPT_DATA.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i] }} />
              <span className="text-slate-600 truncate">{d.name}</span>
              <span className="font-semibold text-slate-800 ml-auto">{d.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly report submission vs review */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Report Submission vs Review</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={WEEKLY_REPORTS} barGap={4}>
            <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis              tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Bar dataKey="submitted" fill="#2563EB" radius={[3,3,0,0]} name="Submitted" />
            <Bar dataKey="reviewed"  fill="#059669" radius={[3,3,0,0]} name="Reviewed"  />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Platform usage trend */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Platform Usage Trend (hours/day)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={ACTIVITY_DATA}>
            <defs>
              <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis              tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--text)" }} />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#7C3AED"
              fill="url(#analyticsGrad)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

    </div>

    {/* Tasks breakdown table */}
    <Card className="p-5 overflow-hidden">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Intern Task Summary</h3>
      <div className="sn-table-scroll -mx-1">
      <table className="w-full text-sm min-w-[36rem]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {["Intern","Department","Score","Tasks Completed","Status"].map(h => (
              <th key={h} className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {INTERN_PERF.map((ip, i) => (
            <tr key={i} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{MOCK_INTERNS[i].name}</td>
              <td className="px-4 py-3 text-slate-500">{MOCK_INTERNS[i].department}</td>
              <td className="px-4 py-3">
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  ⭐ {ip.score}/10
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{ip.tasks}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  MOCK_INTERNS[i].status === "Active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {MOCK_INTERNS[i].status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </Card>

  </div>
);

export default Analytics;