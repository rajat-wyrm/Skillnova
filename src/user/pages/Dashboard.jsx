// ════════════════════════════════════════════════════════════
// USER — pages/Dashboard.jsx
// ════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle,
  ClipboardList,
  CalendarCheck,
  TrendingUp,
  MessageSquare,
  Loader2,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";

import {
  Card,
  StatCard,
  SectionHeader,
} from "../../shared/components/UI";

import api from "../../lib/api";
import { useAuthStore } from "../../lib/auth";
import { formatRelative } from "../../lib/utils";

const MotionDiv = motion.div;

const CHART_COLORS = [
  "#ff6d34",
  "#00bea3",
  "#7C3AED",
  "#f59e0b",
  "#06b6d4",
];

const sampleTasks = [
  {
    id: 1,
    title: "React Dashboard Development",
    status: "DONE",
    priority: "HIGH",
  },
  {
    id: 2,
    title: "API Integration",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
  },
  {
    id: 3,
    title: "Testing",
    status: "TODO",
    priority: "LOW",
  },
];

const sampleReports = [
  {
    id: 1,
    title: "Weekly Report",
    status: "REVIEWED",
    submittedAt: new Date(),
    score: 8,
  },
];

const Dashboard = ({ onNavigate }) => {
  const { user } = useAuthStore();

  const [stats, setStats] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  // ════════════════════════════════════════════════════════
  // Load dashboard data
  // ════════════════════════════════════════════════════════

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        let authenticated = true;

        // Check current session.
        try {
          await api.get("/auth/me");
        } catch (error) {
          authenticated = false;

          // Development-only demo login fallback.
          if (
            error?.response?.status === 401 &&
            import.meta.env.MODE !== "production"
          ) {
            try {
              await api.post("/auth/login", {
                email: "user@skillnova.com",
                password: "User#2026",
              });

              authenticated = true;
            } catch {
              authenticated = false;
            }
          }
        }

        if (!mounted) return;

        // If authentication failed, use local sample data.
        if (!authenticated) {
          setStats({
            total: sampleReports.length,
            reviewed: sampleReports.filter(
              (report) => report.status === "REVIEWED",
            ).length,
            pending: 0,
            averageScore: 8,
          });

          setMyReports(sampleReports);
          setMyTasks(sampleTasks);
          setAttendance({ rate: 90 });

          return;
        }

        // Load dashboard resources.
        const results = await Promise.allSettled([
          api.get("/reports/stats"),
          api.get("/reports", {
            params: { limit: 5 },
          }),
          api.get("/tasks", {
            params: { limit: 50 },
          }),
          api.get("/attendance/summary"),
        ]);

        if (!mounted) return;

        const [statsResult, reportsResult, tasksResult, attendanceResult] =
          results;

        // ── Stats ─────────────────────────────────────────

        if (statsResult.status === "fulfilled") {
          setStats(
            statsResult.value?.data ?? {
              total: 0,
              reviewed: 0,
              pending: 0,
              averageScore: 0,
            },
          );
        } else {
          setStats({
            total: 0,
            reviewed: 0,
            pending: 0,
            averageScore: 0,
          });
        }

        // ── Reports ───────────────────────────────────────

        if (reportsResult.status === "fulfilled") {
          const payload =
            reportsResult.value?.data?.items ??
            reportsResult.value?.data ??
            [];

          setMyReports(
            Array.isArray(payload) && payload.length > 0
              ? payload
              : sampleReports,
          );
        } else {
          setMyReports(sampleReports);
        }

        // ── Tasks ─────────────────────────────────────────

        if (tasksResult.status === "fulfilled") {
          const payload =
            tasksResult.value?.data?.items ??
            tasksResult.value?.data ??
            [];

          setMyTasks(
            Array.isArray(payload) && payload.length > 0
              ? payload
              : sampleTasks,
          );
        } else {
          setMyTasks(sampleTasks);
        }

        // ── Attendance ────────────────────────────────────

        if (attendanceResult.status === "fulfilled") {
          setAttendance(
            attendanceResult.value?.data ?? {
              rate: 90,
            },
          );
        } else {
          setAttendance({
            rate: 90,
          });
        }
      } catch {
        if (!mounted) return;

        setStats({
          total: 0,
          reviewed: 0,
          pending: 0,
          averageScore: 0,
        });

        setMyReports(sampleReports);
        setMyTasks(sampleTasks);
        setAttendance({ rate: 90 });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  // ════════════════════════════════════════════════════════
  // Loading
  // ════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2
          className="animate-spin"
          size={28}
          style={{ color: "var(--muted)" }}
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // Calculations
  // ════════════════════════════════════════════════════════

  const totalTasks = myTasks.length;

  const doneTasks = myTasks.filter(
    (task) => task.status === "DONE",
  ).length;

  const completionPercentage =
    totalTasks > 0
      ? Math.round((doneTasks / totalTasks) * 100)
      : 0;

  const latestReport =
    myReports
      .slice()
      .sort(
        (a, b) =>
          new Date(b.submittedAt || 0) -
          new Date(a.submittedAt || 0),
      )[0] ?? null;

  const weeklySummaryCards = [
    {
      label: "Submitted",
      value: stats?.total ?? 0,
      color: "#ff6d34",
    },
    {
      label: "Reviewed",
      value: stats?.reviewed ?? 0,
      color: "#00bea3",
    },
    {
      label: "Pending review",
      value: stats?.pending ?? 0,
      color: "#f59e0b",
    },
    {
      label: "Average Score",
      value:
        typeof stats?.averageScore === "number"
          ? stats.averageScore.toFixed(1)
          : "—",
      color: "#7C3AED",
    },
  ];

  const myTasksByStatus = [
    "TODO",
    "IN_PROGRESS",
    "REVIEW",
    "DONE",
  ]
    .map((status) => ({
      name: status.replace("_", " "),
      value: myTasks.filter(
        (task) => task.status === status,
      ).length,
    }))
    .filter((item) => item.value > 0);

  const nextDeadline = [...myTasks]
    .filter(
      (task) =>
        task.dueDate &&
        task.status !== "DONE",
    )
    .sort(
      (a, b) =>
        new Date(a.dueDate) -
        new Date(b.dueDate),
    )[0];

  const today = new Date();

  const todayKey = today
    .toISOString()
    .slice(0, 10);

  const todaysTasks = myTasks.filter(
    (task) =>
      task.status !== "DONE" &&
      task.dueDate &&
      String(task.dueDate).slice(0, 10) ===
        todayKey,
  );

  const agendaItems =
    todaysTasks.length > 0
      ? todaysTasks.slice(0, 3)
      : myTasks
          .filter((task) => task.status !== "DONE")
          .slice(0, 3);

  const quickActions = [
    {
      label: "New Report",
      page: "reports",
      icon: ClipboardList,
      color: "#ff6d34",
    },
    {
      label: "Task Board",
      page: "kanban",
      icon: LayoutGrid,
      color: "#00bea3",
    },
    {
      label: "Calendar",
      page: "calendar",
      icon: CalendarCheck,
      color: "#7C3AED",
    },
    {
      label: "Ask AI",
      page: "ai",
      icon: MessageSquare,
      color: "#2563EB",
    },
  ];

  // ════════════════════════════════════════════════════════
  // Greeting
  // ════════════════════════════════════════════════════════

  const currentHour = new Date().getHours();

  let greeting = "Good evening";

  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 17) {
    greeting = "Good afternoon";
  }

  // ════════════════════════════════════════════════════════
  // Local sample helpers
  // ════════════════════════════════════════════════════════

  const addSampleTask = (status = "TODO") => {
    const id = Date.now();

    setMyTasks((previous) => [
      {
        id,
        title: `Sample Task ${id % 1000}`,
        status,
        priority: "MEDIUM",
      },
      ...previous,
    ]);
  };

  const addSampleReport = (status = "REVIEWED") => {
    const id = Date.now();

    setMyReports((previous) => [
      {
        id,
        title: `Sample Report ${id % 1000}`,
        status,
        submittedAt: new Date(),
        score:
          Math.floor(Math.random() * 10) + 1,
      },
      ...previous,
    ]);
  };

  // ════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 pb-16">

      {/* ─────────────────────────────────────────────────── */}
      {/* Hero */}
      {/* ─────────────────────────────────────────────────── */}

      <MotionDiv
        initial={{
          opacity: 0,
          y: -20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="relative rounded-xl overflow-hidden shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, #2D3436 0%, #1a1f20 60%, #2D3436 100%)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background:
              "linear-gradient(90deg, #ff6d34, #00bea3)",
          }}
        />

        <div className="relative p-7 sm:p-10">

          <p
            className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-2"
            style={{ color: "#00bea3" }}
          >
            {new Date().toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
              },
            )}
          </p>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            {greeting},
            <br className="sm:hidden" />{" "}
            {user?.name?.split(" ")[0] || "there"}! 👋
          </h1>

          <p className="mt-4 text-sm sm:text-base font-medium text-slate-400 max-w-lg leading-relaxed">
            You have{" "}
            <span className="text-white font-bold">
              {
                myTasks.filter(
                  (task) =>
                    task.status !== "DONE",
                ).length
              }{" "}
              pending tasks
            </span>{" "}
            and{" "}
            <span className="text-white font-bold">
              {stats?.pending ?? 0}
            </span>{" "}
            reports awaiting review.
          </p>

          {/* Demo controls */}
          {import.meta.env.MODE !== "production" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  addSampleTask("TODO")
                }
                className="px-3 py-1 rounded bg-gray-700 text-white text-sm"
              >
                Add Sample Task
              </button>

              <button
                onClick={() =>
                  addSampleTask("IN_PROGRESS")
                }
                className="px-3 py-1 rounded bg-orange-500 text-white text-sm"
              >
                Add In Progress
              </button>

              <button
                onClick={() =>
                  addSampleTask("DONE")
                }
                className="px-3 py-1 rounded bg-green-600 text-white text-sm"
              >
                Add Done
              </button>

              <button
                onClick={() =>
                  addSampleReport("REVIEWED")
                }
                className="px-3 py-1 rounded bg-violet-600 text-white text-sm"
              >
                Add Sample Report
              </button>
            </div>
          )}

          {/* Weekly summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-2xl">
            {weeklySummaryCards.map(
              ({
                label,
                value,
                color,
              }) => (
                <div
                  key={label}
                  className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-4 border border-white/10 shadow-sm"
                >
                  <p className="font-black text-xl text-white">
                    {value}
                  </p>

                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mt-1"
                    style={{ color }}
                  >
                    {label}
                  </p>
                </div>
              ),
            )}
          </div>

          {/* Secondary summary */}
          <div className="grid grid-cols-3 gap-3 mt-4 max-w-xl">
            {[
              [
                stats?.reviewed ?? 0,
                "Reports",
              ],
              [
                `${attendance?.rate ?? 0}%`,
                "Attendance",
              ],
              [
                `${
                  typeof user?.rating ===
                  "number"
                    ? user.rating.toFixed(1)
                    : "—"
                }`,
                "Score",
              ],
            ].map(([value, label]) => (
              <div
                key={label}
                className="bg-white/5 backdrop-blur-md rounded-2xl px-4 py-4 border border-white/10"
              >
                <p className="font-black text-xl text-white">
                  {value}
                </p>

                <p
                  className="text-[10px] font-bold uppercase tracking-wider mt-1"
                  style={{
                    color: "#ff6d34",
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Completion */}
          <div className="mt-6 max-w-xl">
            <div className="flex items-center justify-between mb-2 text-sm font-semibold text-slate-200">
              <span>
                Completion Percentage
              </span>

              <span>
                {completionPercentage}%
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${completionPercentage}%`,
                  background:
                    "linear-gradient(90deg, #ff6d34, #00bea3)",
                }}
              />
            </div>
          </div>

          {/* Weekly progress */}
          <div className="mt-6 max-w-xl bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: "#111827",
                  }}
                >
                  Weekly Progress Summary
                </p>

                <p className="text-xs text-slate-500">
                  Latest report status and score
                </p>
              </div>

              <div
                className="text-sm font-semibold"
                style={{
                  color: "#ff6d34",
                }}
              >
                {latestReport?.weekNumber
                  ? `W${latestReport.weekNumber}`
                  : "—"}
              </div>
            </div>

            {latestReport ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white/80 p-4 border border-slate-200">
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{
                      color: "#111827",
                    }}
                  >
                    {latestReport.title}
                  </p>

                  <p className="text-xs text-slate-500">
                    {latestReport.status} ·
                    Submitted{" "}
                    {latestReport.submittedAt
                      ? new Date(
                          latestReport.submittedAt,
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/80 p-4 border border-slate-200">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Score
                    </p>

                    <p
                      className="text-lg font-black"
                      style={{
                        color: "#111827",
                      }}
                    >
                      {latestReport.score != null
                        ? `${latestReport.score}/10`
                        : "Pending"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/80 p-4 border border-slate-200">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Review status
                    </p>

                    <p
                      className="text-lg font-black"
                      style={{
                        color: "#111827",
                      }}
                    >
                      {latestReport.status}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No weekly report submitted yet.
              </p>
            )}
          </div>
        </div>
      </MotionDiv>

      {/* ─────────────────────────────────────────────────── */}
      {/* Statistics */}
      {/* ─────────────────────────────────────────────────── */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={stats?.total ?? 0}
          icon={ClipboardList}
          color="#ff6d34"
        />

        <StatCard
          title="Reviewed"
          value={stats?.reviewed ?? 0}
          icon={CheckCircle}
          color="#00bea3"
        />

        <StatCard
          title="Attendance Rate"
          value={`${attendance?.rate ?? 0}%`}
          icon={CalendarCheck}
          color="#ff6d34"
        />

        <StatCard
          title="Avg Score"
          value={
            typeof stats?.averageScore ===
            "number"
              ? stats.averageScore.toFixed(1)
              : "—"
          }
          icon={TrendingUp}
          color="#00bea3"
          subtitle="/10"
        />
      </div>

      {/* ─────────────────────────────────────────────────── */}
      {/* Quick Actions + Deadline */}
      {/* ─────────────────────────────────────────────────── */}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-sm font-semibold"
                style={{
                  color: "var(--text)",
                }}
              >
                Quick Actions
              </h3>

              <p
                className="text-xs mt-1"
                style={{
                  color: "var(--muted)",
                }}
              >
                Jump to the most useful places
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(
              (action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.page}
                    onClick={() =>
                      onNavigate?.(
                        action.page,
                      )
                    }
                    className="flex items-center justify-between rounded-xl border px-3 py-3 text-left transition hover:-translate-y-0.5"
                    style={{
                      borderColor:
                        "var(--border)",
                      background:
                        "var(--bg)",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="p-2 rounded-lg"
                        style={{
                          background: `${action.color}20`,
                          color: action.color,
                        }}
                      >
                        <Icon size={14} />
                      </span>

                      <span
                        className="text-sm font-medium"
                        style={{
                          color:
                            "var(--text)",
                        }}
                      >
                        {action.label}
                      </span>
                    </span>

                    <ArrowRight
                      size={14}
                      style={{
                        color:
                          "var(--muted)",
                      }}
                    />
                  </button>
                );
              },
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3
            className="text-sm font-semibold mb-3"
            style={{
              color: "var(--text)",
            }}
          >
            Next Deadline
          </h3>

          {nextDeadline ? (
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--bg)",
                border:
                  "1px solid var(--border)",
              }}
            >
              <p
                className="text-sm font-semibold"
                style={{
                  color: "var(--text)",
                }}
              >
                {nextDeadline.title}
              </p>

              <p
                className="text-xs mt-1"
                style={{
                  color: "var(--muted)",
                }}
              >
                {formatRelative(
                  nextDeadline.dueDate,
                )}{" "}
                ·{" "}
                {String(
                  nextDeadline.status ||
                    "",
                ).replace("_", " ")}
              </p>
            </div>
          ) : (
            <p
              className="text-sm py-6 text-center"
              style={{
                color: "var(--muted)",
              }}
            >
              No upcoming deadlines.
            </p>
          )}
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────── */}
      {/* Today's Agenda */}
      {/* ─────────────────────────────────────────────────── */}

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3
              className="text-sm font-semibold"
              style={{
                color: "var(--text)",
              }}
            >
              Today's Agenda
            </h3>

            <p
              className="text-xs mt-1"
              style={{
                color: "var(--muted)",
              }}
            >
              {todaysTasks.length > 0
                ? "Priority items for today"
                : "No tasks scheduled for today"}
            </p>
          </div>
        </div>

        {agendaItems.length === 0 ? (
          <p
            className="text-sm py-6 text-center"
            style={{
              color: "var(--muted)",
            }}
          >
            All clear — nothing urgent
            today.
          </p>
        ) : (
          <div className="space-y-2">
            {agendaItems.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{
                  background: "var(--bg)",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background:
                      task.priority ===
                        "HIGH" ||
                      task.priority ===
                        "URGENT"
                        ? "#ff6d34"
                        : "#00bea3",
                  }}
                />

                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color: "var(--text)",
                    }}
                  >
                    {task.title}
                  </p>

                  <p
                    className="text-xs"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    {task.dueDate
                      ? formatRelative(
                          task.dueDate,
                        )
                      : String(
                          task.status ||
                            "",
                        ).replace(
                          "_",
                          " ",
                        )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─────────────────────────────────────────────────── */}
      {/* Charts */}
      {/* ─────────────────────────────────────────────────── */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tasks by status */}
        <Card className="p-5">
          <h3
            className="text-sm font-semibold mb-4"
            style={{
              color: "var(--text)",
            }}
          >
            My Tasks by Status
          </h3>

          {myTasksByStatus.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{
                color: "var(--muted)",
              }}
            >
              No tasks yet.
            </p>
          ) : (
            <>
              <ResponsiveContainer
                width="100%"
                height={200}
              >
                <PieChart>
                  <Pie
                    data={myTasksByStatus}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {myTasksByStatus.map(
                      (item, index) => (
                        <Cell
                          key={item.name}
                          fill={
                            CHART_COLORS[
                              index %
                                CHART_COLORS.length
                            ]
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border:
                        "1px solid var(--border)",
                      fontSize: 12,
                      background:
                        "var(--card)",
                      color:
                        "var(--text)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {myTasksByStatus.map(
                  (item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background:
                            CHART_COLORS[
                              index %
                                CHART_COLORS.length
                            ],
                        }}
                      />

                      <span
                        style={{
                          color:
                            "var(--muted)",
                        }}
                        className="truncate"
                      >
                        {item.name}
                      </span>

                      <span
                        className="font-semibold ml-auto"
                        style={{
                          color:
                            "var(--text)",
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </Card>

        {/* Recent reports */}
        <Card className="p-5">
          <h3
            className="text-sm font-semibold mb-4"
            style={{
              color: "var(--text)",
            }}
          >
            Recent Reports
          </h3>

          {myReports.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{
                color: "var(--muted)",
              }}
            >
              No reports submitted yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {myReports
                .slice(0, 5)
                .map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-3 p-2 rounded-lg"
                    style={{
                      background:
                        "var(--bg)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          report.status ===
                          "REVIEWED"
                            ? "rgba(0,190,163,0.15)"
                            : "rgba(255,109,52,0.15)",
                      }}
                    >
                      <CheckCircle
                        size={14}
                        style={{
                          color:
                            report.status ===
                            "REVIEWED"
                              ? "#00bea3"
                              : "#ff6d34",
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{
                          color:
                            "var(--text)",
                        }}
                      >
                        {report.title}
                      </p>

                      <p
                        className="text-xs"
                        style={{
                          color:
                            "var(--muted)",
                        }}
                      >
                        {report.submittedAt
                          ? formatRelative(
                              report.submittedAt,
                            )
                          : "No date"}{" "}
                        ·{" "}
                        {report.status}
                      </p>
                    </div>

                    {report.score != null && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            "rgba(245,158,11,0.15)",
                          color: "#d97706",
                        }}
                      >
                        {report.score}/10
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────── */}
      {/* Open Tasks */}
      {/* ─────────────────────────────────────────────────── */}

      <Card className="p-5">
        <SectionHeader
          title="Open Tasks"
          subtitle="What you're working on right now"
        />

        {myTasks.filter(
          (task) => task.status !== "DONE",
        ).length === 0 ? (
          <p
            className="text-sm text-center py-8"
            style={{
              color: "var(--muted)",
            }}
          >
            All caught up — no open tasks
            🎉
          </p>
        ) : (
          <div className="space-y-2">
            {myTasks
              .filter(
                (task) =>
                  task.status !== "DONE",
              )
              .slice(0, 8)
              .map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition"
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background =
                      "var(--bg)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background =
                      "transparent";
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background:
                        task.priority ===
                          "HIGH" ||
                        task.priority ===
                          "URGENT"
                          ? "#ff6d34"
                          : task.priority ===
                              "MEDIUM"
                            ? "#f59e0b"
                            : "#94a3b8",
                    }}
                  />

                  <p
                    className="text-sm flex-1 truncate"
                    style={{
                      color:
                        "var(--text)",
                    }}
                  >
                    {task.title}
                  </p>

                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background:
                        "rgba(255,109,52,0.15)",
                      color: "#ff6d34",
                    }}
                  >
                    {String(
                      task.status || "",
                    ).replace(
                      "_",
                      " ",
                    )}
                  </span>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* ─────────────────────────────────────────────────── */}
      {/* Milestones & Activities */}
      {/* ─────────────────────────────────────────────────── */}

      <Card className="p-5">
        <SectionHeader
          title="Milestones & Recent Activities"
          subtitle="Track your achievements"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Milestones */}
          <div>
            <h3 className="font-semibold mb-3">
              🏆 Milestones
            </h3>

            <div className="space-y-3">
              <div
                className="p-3 rounded-xl"
                style={{
                  background:
                    "var(--bg)",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{
                    color:
                      "var(--text)",
                  }}
                >
                  ✅ First Task Completed
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {doneTasks} tasks finished
                </p>
              </div>

              <div
                className="p-3 rounded-xl"
                style={{
                  background:
                    "var(--bg)",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{
                    color:
                      "var(--text)",
                  }}
                >
                  📄 Reports Submitted
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {stats?.total ?? 0} reports
                </p>
              </div>

              <div
                className="p-3 rounded-xl"
                style={{
                  background:
                    "var(--bg)",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{
                    color:
                      "var(--text)",
                  }}
                >
                  🎯 Attendance Achieved
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {attendance?.rate ?? 0}%
                  rate
                </p>
              </div>
            </div>
          </div>

          {/* Recent activities */}
          <div>
            <h3 className="font-semibold mb-3">
              📝 Recent Activities
            </h3>

            <div className="space-y-3">
              <div
                className="p-3 rounded-xl"
                style={{
                  background:
                    "var(--bg)",
                }}
              >
                <p
                  className="text-sm"
                  style={{
                    color:
                      "var(--text)",
                  }}
                >
                  📄 Submitted Weekly Report
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {latestReport?.submittedAt
                    ? new Date(
                        latestReport.submittedAt,
                      ).toLocaleDateString()
                    : "No reports yet"}
                </p>
              </div>

              <div
                className="p-3 rounded-xl"
                style={{
                  background:
                    "var(--bg)",
                }}
              >
                <p
                  className="text-sm"
                  style={{
                    color:
                      "var(--text)",
                  }}
                >
                  ✅ Completed UI Dashboard
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Updated your project
                  dashboard view
                </p>
              </div>

              <div
                className="p-3 rounded-xl"
                style={{
                  background:
                    "var(--bg)",
                }}
              >
                <p
                  className="text-sm"
                  style={{
                    color:
                      "var(--text)",
                  }}
                >
                  📌 Updated Task Status
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Recent task statuses were
                  refreshed
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────── */}
      {/* Floating Q&A button */}
      {/* ─────────────────────────────────────────────────── */}

      {onNavigate && (
        <button
          onClick={() =>
            onNavigate("qa")
          }
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-110 transition-transform z-50 group"
          style={{
            background:
              "linear-gradient(135deg, #25D366, #128C7E)",
          }}
          title="Q&A Forum"
        >
          <MessageSquare className="text-white" />

          <span className="absolute right-full mr-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
            Q&A Forum
          </span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;