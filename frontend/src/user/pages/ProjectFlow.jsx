// ══════════════════════════════════════════════
//  USER — pages/ProjectFlow.jsx
// ══════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  PlayCircle,
  Settings,
  BarChart2,
  Activity,
  PieChart as PieIcon,
  } from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, SectionHeader } from "../../shared/components/UI";
import { EmptyState, ErrorState } from "../../shared/components/AppState";
import { UserProjectFlowSkeleton } from "../../shared/components/PageSkeletons";
import { getReports } from "../../shared/services/api/reportsApi";

const MotionDiv = motion.div;
const CHART_COLORS = ["#00bea3", "#ff6d34", "#f59e0b"];
const REPORT_GOAL = 5;

const statusIcons = {
  completed: CheckCircle,
  "in-progress": PlayCircle,
  pending: Clock,
};

const getReportItems = response => {
  const items = response?.data || response || [];
  return Array.isArray(items) ? items : [];
};

const buildCurrentPhase = reports => {
  if (reports.length === 0) {
    return "Ready to Start";
  }

  if (reports.length >= REPORT_GOAL) {
    return "Consistent Delivery";
  }

  if (reports.length >= 3) {
    return "Active Contribution";
  }

  return "Building Momentum";
};

const buildMilestones = reports => {
  const reportCount = reports.length;
  const hasRecentSubmission = reports.some(report => {
    const submittedAt = new Date(report.createdAt || report.updatedAt || Date.now());
    return Date.now() - submittedAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
  });

  return [
    {
      id: "first-report",
      title: "Submit your first project report",
      status: reportCount >= 1 ? "completed" : "pending",
    },
    {
      id: "build-momentum",
      title: "Build a steady reporting rhythm",
      status: reportCount >= 3 ? "completed" : reportCount >= 1 ? "in-progress" : "pending",
    },
    {
      id: "stay-active",
      title: "Stay active with recent progress updates",
      status: hasRecentSubmission ? "completed" : reportCount >= 1 ? "in-progress" : "pending",
    },
  ];
};

const buildAnalytics = reports => {
  if (reports.length === 0) {
    return [];
  }

  const sorted = [...reports].sort(
    (left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0)
  );

  return sorted.slice(-6).map((report, index) => ({
    name: `R${index + 1}`,
    progress: Math.min(
      100,
      Math.round(((index + 1) / Math.max(sorted.length, REPORT_GOAL)) * 100)
    ),
    title: report.title || `Report ${index + 1}`,
  }));
};

const buildDistribution = reports => {
  if (reports.length === 0) {
    return [];
  }

  const now = Date.now();
  const buckets = [
    {
      name: "This Week",
      count: reports.filter(report => {
        const createdAt = new Date(report.createdAt || report.updatedAt || now);
        return now - createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
      }).length,
    },
    {
      name: "This Month",
      count: reports.filter(report => {
        const createdAt = new Date(report.createdAt || report.updatedAt || now);
        const age = now - createdAt.getTime();
        return age > 7 * 24 * 60 * 60 * 1000 && age <= 30 * 24 * 60 * 60 * 1000;
      }).length,
    },
    {
      name: "Earlier",
      count: reports.filter(report => {
        const createdAt = new Date(report.createdAt || report.updatedAt || now);
        return now - createdAt.getTime() > 30 * 24 * 60 * 60 * 1000;
      }).length,
    },
  ];

  return buckets
    .filter(bucket => bucket.count > 0)
    .map(bucket => ({
      name: bucket.name,
      value: Math.round((bucket.count / reports.length) * 100),
    }));
};

const mapProjectFlowResponse = response => {
  const reports = getReportItems(response);

  return {
    reports,
    milestones: buildMilestones(reports),
    analyticsData: buildAnalytics(reports),
    statusDistribution: buildDistribution(reports),
    currentPhase: buildCurrentPhase(reports),
  };
};

const ProjectFlow = () => {
  const [milestones, setMilestones] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [currentPhase, setCurrentPhase] = useState("Loading...");
  const [reportCount, setReportCount] = useState(0);
  const [pageState, setPageState] = useState("loading");
  const [error, setError] = useState("");

  const loadProjectFlow = async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) {
        setPageState("loading");
      }
      setError("");

      const response = await getReports();
      return mapProjectFlowResponse(response);
    } catch (loadError) {
      throw new Error(loadError.message || "Failed to load project flow.");
    }
  };

  useEffect(() => {
    let isActive = true;

    const initializeProjectFlow = async () => {
      try {
        const data = await loadProjectFlow();
        if (!isActive) {
          return;
        }

        setMilestones(data.milestones);
        setAnalyticsData(data.analyticsData);
        setStatusDistribution(data.statusDistribution);
        setCurrentPhase(data.currentPhase);
        setReportCount(data.reports.length);
        setPageState("ready");
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(loadError.message || "Failed to load project flow.");
        setPageState("error");
      }
    };

    initializeProjectFlow();

    return () => {
      isActive = false;
    };
  }, []);

  const handleRetry = async () => {
    try {
      const data = await loadProjectFlow({ showLoading: true });

      setMilestones(data.milestones);
      setAnalyticsData(data.analyticsData);
      setStatusDistribution(data.statusDistribution);
      setCurrentPhase(data.currentPhase);
      setReportCount(data.reports.length);
      setPageState("ready");
    } catch (loadError) {
      setError(loadError.message || "Failed to load project flow.");
      setPageState("error");
    }
  };

  const hasNoData = useMemo(() => reportCount === 0, [reportCount]);

  if (pageState === "loading") {
    return <UserProjectFlowSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Project Flow"
          subtitle="Track progress using your real report activity"
        />
        <ErrorState
          title="Could not load project flow"
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
      </div>
    );
  }

  if (hasNoData) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Project Flow"
          subtitle="Track progress using your real report activity"
        />
        <EmptyState
          title="No project activity yet"
          description="This page will populate after your first report is submitted through the backend."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Flow"
        subtitle="Track progress using your real report activity"
      />

      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-xl overflow-hidden shadow-lg p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, #1a1f20 0%, #2D3436 100%)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: "linear-gradient(90deg, #00bea3, #3b82f6)",
          }}
        />

        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          SkillNova Platform
        </h1>

        <p className="mt-2 text-sm sm:text-base" style={{ color: "#9ca3af" }}>
          Current Project Phase:{" "}
          <span style={{ color: "#00bea3", fontWeight: 600 }}>
            {currentPhase}
          </span>
        </p>

        <p className="mt-1 text-sm" style={{ color: "#d1d5db" }}>
          Reports submitted: {reportCount}
        </p>
      </MotionDiv>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3
            className="text-lg font-semibold mb-6 flex items-center gap-2"
            style={{ color: "var(--text)" }}
          >
            <Activity className="w-5 h-5 text-blue-500" />
            Project Flow
          </h3>

          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const Icon = statusIcons[milestone.status] || Settings;
              const isCompleted = milestone.status === "completed";
              const isInProgress = milestone.status === "in-progress";

              return (
                <div
                  key={milestone.id}
                  className="relative flex items-start gap-4"
                >
                  {index !== milestones.length - 1 && (
                    <div
                      className="absolute left-[19px] top-8 bottom-[-16px] w-[2px]"
                      style={{
                        background: isCompleted ? "#00bea3" : "var(--border)",
                      }}
                    />
                  )}

                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{
                      background: isCompleted
                        ? "rgba(0,190,163,0.15)"
                        : isInProgress
                          ? "rgba(255,109,52,0.15)"
                          : "var(--card)",
                      border: `1px solid ${
                        isCompleted
                          ? "#00bea3"
                          : isInProgress
                            ? "#ff6d34"
                            : "var(--border)"
                      }`,
                    }}
                  >
                    <Icon
                      size={20}
                      color={
                        isCompleted
                          ? "#00bea3"
                          : isInProgress
                            ? "#ff6d34"
                            : "var(--muted)"
                      }
                    />
                  </div>

                  <div className="flex-1 pt-2">
                    <h4
                      className="text-sm font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {milestone.title}
                    </h4>

                    <span
                      className="text-xs uppercase tracking-wider font-bold mt-1 inline-block"
                      style={{
                        color: isCompleted
                          ? "#00bea3"
                          : isInProgress
                            ? "#ff6d34"
                            : "var(--muted)",
                      }}
                    >
                      {milestone.status.replace("-", " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: "var(--text)" }}
            >
              <BarChart2 className="w-5 h-5 text-orange-500" />
              Progress Overview
            </h3>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={analyticsData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorProgress"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#00bea3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00bea3" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />

                <Tooltip
                  formatter={(value, _name, item) => [
                    `${value}%`,
                    item?.payload?.title || "Progress",
                  ]}
                  contentStyle={{
                    background: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                    borderRadius: "8px",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="#00bea3"
                  fillOpacity={1}
                  fill="url(#colorProgress)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: "var(--text)" }}
            >
              <PieIcon className="w-5 h-5 text-purple-500" />
              Submission Distribution
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-3 w-full">
                {statusDistribution.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />

                      <span style={{ color: "var(--muted)" }}>
                        {item.name}
                      </span>
                    </div>

                    <span
                      className="font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectFlow;


