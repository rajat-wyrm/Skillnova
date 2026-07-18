import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, BookOpen, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, SectionHeader, StatCard } from "../../shared/components/UI";
import { AdminAnalyticsSkeleton } from "../../shared/components/PageSkeletons";
import { getAdminAnalyticsData } from "../../shared/services/api";
import { CHART_COLORS } from "../../shared/utils/constants";

const DEFAULT_ANALYTICS = {
  statCards: [],
  performanceData: [],
  departmentData: [],
  weeklyReports: [],
  activityTrend: [],
  taskSummary: [],
};

const STAT_CARD_ICONS = [FileText, TrendingUp, BookOpen, MessageSquare];

const AnalyticsSkeleton = AdminAnalyticsSkeleton;

const AnalyticsError = ({ message, onRetry }) => (
  <div className="space-y-6">
    <SectionHeader
      title="Platform Analytics"
      subtitle="Insights across all interns, reports and platform activity"
    />

    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="rounded-xl p-2.5 flex-shrink-0"
            style={{ background: "rgba(255,109,52,0.12)", color: "#ff6d34" }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Unable to load analytics
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {message || "Analytics data is currently unavailable."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition self-start sm:self-auto"
          style={{ background: "#ff6d34" }}
        >
          Retry
        </button>
      </div>
    </Card>
  </div>
);

const Analytics = () => {
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAdminAnalyticsData();
      setAnalytics(data);
    } catch (loadError) {
      setAnalytics(DEFAULT_ANALYTICS);
      setError(loadError?.message || "Analytics data is currently unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const activityData = analytics.activityTrend.map(item => ({
    day: item.day,
    hours: item.activity,
  }));

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return <AnalyticsError message={error} onRetry={loadAnalytics} />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Platform Analytics"
        subtitle="Insights across all interns, reports and platform activity"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.statCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={STAT_CARD_ICONS[index]}
            color={stat.color}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Intern Performance Scores
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.performanceData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  background: "var(--card)",
                  color: "var(--text)",
                }}
                formatter={value => [`${value}/10`, "Score"]}
              />
              <Bar dataKey="score" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Interns by Department</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={analytics.departmentData}
                dataKey="value"
                nameKey="name"
                outerRadius={75}
                innerRadius={40}
                paddingAngle={3}
              >
                {analytics.departmentData.map((item, index) => (
                  <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  background: "var(--card)",
                  color: "var(--text)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {analytics.departmentData.map((department, index) => (
              <div key={department.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-slate-600 truncate">{department.name}</span>
                <span className="font-semibold text-slate-800 ml-auto">{department.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Report Submission vs Review
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.weeklyReports} barGap={4}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  background: "var(--card)",
                  color: "var(--text)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="submitted" fill="#2563EB" radius={[3, 3, 0, 0]} name="Submitted" />
              <Bar dataKey="reviewed" fill="#059669" radius={[3, 3, 0, 0]} name="Reviewed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Platform Usage Trend (hours/day)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  background: "var(--card)",
                  color: "var(--text)",
                }}
              />
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

      <Card className="p-5 overflow-hidden">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Intern Task Summary</h3>
        <div className="sn-table-scroll -mx-1">
          <table className="w-full text-sm min-w-[36rem]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Intern", "Department", "Score", "Tasks Completed", "Status"].map(header => (
                  <th
                    key={header}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.taskSummary.map(intern => (
                <tr key={`${intern.name}-${intern.department}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{intern.name}</td>
                  <td className="px-4 py-3 text-slate-500">{intern.department}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      {intern.score}/10
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{intern.tasks}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        intern.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {intern.status}
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
};

export default Analytics;

