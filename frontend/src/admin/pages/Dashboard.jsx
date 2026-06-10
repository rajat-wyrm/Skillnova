import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, CalendarCheck, HelpCircle, Shield, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, StatCard } from "../../shared/components/UI";
import { AdminDashboardSkeleton } from "../../shared/components/PageSkeletons";
import { getAdminDashboardData } from "../../shared/services/api";

const DEFAULT_DASHBOARD = {
  heroLabel: "",
  heroStats: [],
  statCards: [],
  weeklyActivity: [],
  recentActions: [],
  activityTrend: [],
};

const STAT_CARD_ICONS = [AlertCircle, Star, CalendarCheck, HelpCircle];

const getMetricNumber = value => {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : 0;
};

const hasDashboardContent = dashboard => {
  const heroHasValue = dashboard.heroStats.some(item => getMetricNumber(item?.value) > 0);
  const statHasValue = dashboard.statCards.some(item => getMetricNumber(item?.value) > 0);
  const weeklyHasActivity = dashboard.weeklyActivity.some(
    item => Number(item?.logins || 0) > 0 || Number(item?.reports || 0) > 0
  );
  const trendHasActivity = dashboard.activityTrend.some(item => Number(item?.activity || 0) > 0);

  return (
    heroHasValue ||
    statHasValue ||
    weeklyHasActivity ||
    trendHasActivity ||
    dashboard.recentActions.length > 0
  );
};

const DashboardSkeleton = AdminDashboardSkeleton;

const DashboardError = ({ message, onRetry }) => (
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
            Unable to load dashboard
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {message || "Dashboard data is currently unavailable."}
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
);

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAdminDashboardData();
      setDashboard(data);
    } catch (loadError) {
      setDashboard(DEFAULT_DASHBOARD);
      setError(loadError?.message || "Dashboard data is currently unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const areaData = dashboard.activityTrend.map(item => ({
    day: item.day,
    hours: item.activity,
  }));

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !hasDashboardContent(dashboard)) {
    return (
      <DashboardError
        message={error || "Dashboard data is currently unavailable."}
        onRetry={loadDashboard}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1f20 0%, #2D3436 100%)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "linear-gradient(90deg, #ff6d34, #00bea3)" }}
        />

        <div className="relative p-4 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium mb-1" style={{ color: "#ff6d34" }}>
                Admin Overview {"\u00B7"} {dashboard.heroLabel}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Platform Dashboard</h1>
              <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
                Monitor interns, knowledge base and platform activity
              </p>
            </div>
            <div
              className="rounded-xl p-3 self-start"
              style={{
                background: "rgba(255,109,52,0.15)",
                border: "1px solid rgba(255,109,52,0.3)",
              }}
            >
              <Shield size={26} style={{ color: "#ff6d34" }} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {dashboard.heroStats.map(({ value, label, change }) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                  {label}
                </p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "#00bea3" }}>
                  {change}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboard.statCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={STAT_CARD_ICONS[index]}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#2D3436" }}>
            Weekly Platform Activity
          </h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={dashboard.weeklyActivity} barGap={4}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Bar dataKey="logins" fill="#ff6d34" radius={[3, 3, 0, 0]} name="Logins" />
              <Bar dataKey="reports" fill="#00bea3" radius={[3, 3, 0, 0]} name="Reports" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            {[
              ["#ff6d34", "Logins"],
              ["#00bea3", "Reports"],
            ].map(([color, label]) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "#6b7280" }}
              >
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#2D3436" }}>
            Recent Actions
          </h3>
          <div className="space-y-3">
            {dashboard.recentActions.map((action, index) => (
              <div key={`${action.action}-${index}`} className="flex items-start gap-3">
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{
                    background:
                      action.color === "orange"
                        ? "#ff6d34"
                        : action.color === "green"
                          ? "#00bea3"
                          : "#2D3436",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "#374151" }}>
                    {action.action}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#9ca3af" }}>
                    {action.detail}
                  </p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "#9ca3af" }}>
                  {action.time} ago
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "#2D3436" }}>
          Platform Usage Trend (hrs)
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={areaData}>
            <defs>
              <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00bea3" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00bea3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#00bea3"
              fill="url(#adminGrad)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default AdminDashboard;


