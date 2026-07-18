import { getAnnouncements } from "./announcementsApi";
import { getAdminKnowledgeArticles, getKnowledgeArticles } from "./knowledgeApi";
import { getQaQuestions } from "./qaApi";
import { getInterns } from "./internsApi";
import { getReports, getAdminReports, getUserReports } from "./reportsApi";
import { getCurrentUser, getAdminUsers } from "./usersApi";
import {
  buildAdminRecentActions,
  buildDashboardDailyCounts,
  buildUserRecentActivity,
  getDashboardList,
  getDashboardPendingTasks,
  getDashboardSkillDistribution,
  normalizeDashboardAnnouncement,
  normalizeDashboardArticle,
  normalizeDashboardIntern,
  normalizeDashboardMilestone,
  normalizeDashboardProfile,
  normalizeDashboardReport,
  normalizeDashboardUser,
} from "./insightsHelpers";

/**
 * Aggregates admin dashboard data into a single UI-friendly payload.
 * This keeps the admin page contract realistic by combining users, interns,
 * reports, articles, announcements, and Q&A into one resilient response.
 */
export const getAdminDashboardData = async () => {
  const results = await Promise.allSettled([
    getCurrentUser(),
    getInterns(),
    getAdminUsers(),
    getAdminReports(),
    getAdminKnowledgeArticles(),
    getAnnouncements(),
    getQaQuestions(),
  ]);

  const [
    profileResult,
    internsResult,
    usersResult,
    reportsResult,
    articlesResult,
    announcementsResult,
    questionsResult,
  ] = results;

  const profile = normalizeDashboardProfile(
    profileResult.status === "fulfilled" ? profileResult.value : null
  );
  const interns =
    internsResult.status === "fulfilled"
      ? getDashboardList(internsResult.value).map(normalizeDashboardIntern).filter(Boolean)
      : [];
  const users =
    usersResult.status === "fulfilled"
      ? getDashboardList(usersResult.value, ["users"]).map(normalizeDashboardUser).filter(Boolean)
      : [];
  const reports =
    reportsResult.status === "fulfilled"
      ? getDashboardList(reportsResult.value, ["reports"]).map(normalizeDashboardReport).filter(Boolean)
      : [];
  const articles =
    articlesResult.status === "fulfilled"
      ? getDashboardList(articlesResult.value, ["articles"]).map(normalizeDashboardArticle).filter(Boolean)
      : [];
  const announcements =
    announcementsResult.status === "fulfilled"
      ? getDashboardList(announcementsResult.value, ["announcements"])
          .map(normalizeDashboardAnnouncement)
          .filter(Boolean)
      : [];
  const questions =
    questionsResult.status === "fulfilled"
      ? getDashboardList(questionsResult.value, ["questions"])
      : [];

  const failedSections = results.filter(result => result.status === "rejected").length;

  if (
    failedSections === results.length ||
    (!interns.length &&
      !users.length &&
      !reports.length &&
      !articles.length &&
      !announcements.length &&
      !questions.length)
  ) {
    throw new Error("Dashboard data unavailable");
  }

  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const reportsThisWeek = reports.filter(item => item.timestamp && item.timestamp >= weekAgo);
  const activeUsers =
    users.filter(item => item.status === "Active").length ||
    interns.filter(item => item.status === "Active").length;
  const pendingReviews = reports.filter(item => item.status === "Pending").length;
  const scoredReports = reports.map(item => item.score).filter(item => item !== null);
  const avgScore = scoredReports.length
    ? (scoredReports.reduce((sum, value) => sum + value, 0) / scoredReports.length).toFixed(1)
    : "0.0";
  const presentCount = interns.filter(item => item.attendance === "Present").length;
  const attendanceRate = interns.length ? Math.round((presentCount / interns.length) * 100) : 0;
  const questionsWithAnswerCounts = questions.filter(item =>
    Object.prototype.hasOwnProperty.call(item ?? {}, "answers")
  );
  const openQuestions = questionsWithAnswerCounts.length
    ? questionsWithAnswerCounts.filter(item => !Number(item.answers)).length
    : questions.length;

  const reportTrend = buildDashboardDailyCounts(reports, 5);
  const userTrend = buildDashboardDailyCounts(
    users.map(item => ({ timestamp: item.createdAt })).filter(item => item.timestamp),
    5
  );
  const weeklyActivity = reportTrend.map((item, index) => ({
    day: item.label,
    reports: item.count,
    logins: userTrend[index]?.count ?? 0,
  }));

  const activityTrend = buildDashboardDailyCounts(
    [
      ...reports.map(item => ({ timestamp: item.timestamp })),
      ...articles.map(item => ({ timestamp: item.timestamp })),
      ...announcements.map(item => ({ timestamp: item.timestamp })),
    ].filter(item => item.timestamp),
    7
  ).map(item => ({
    day: item.label,
    activity: item.count,
  }));

  return {
    profile,
    partialData: failedSections > 0,
    heroLabel: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    heroStats: [
      {
        value: String(interns.length),
        label: "Total Interns",
        change: `${presentCount} present`,
      },
      {
        value: String(activeUsers),
        label: "Active Users",
        change: `${users.length || interns.length} total tracked`,
      },
      {
        value: String(reportsThisWeek.length),
        label: "Reports This Week",
        change: `${pendingReviews} pending`,
      },
      {
        value: String(articles.length),
        label: "KB Articles",
        change: `${articles.filter(item => item.verified).length} verified`,
      },
    ],
    statCards: [
      {
        title: "Pending Reviews",
        value: String(pendingReviews),
        color: "#ff6d34",
      },
      {
        title: "Avg Score",
        value: `${avgScore}/10`,
        color: "#00bea3",
      },
      {
        title: "Attendance Rate",
        value: `${attendanceRate}%`,
        color: "#00bea3",
      },
      {
        title: "Open Questions",
        value: String(openQuestions),
        color: "#ff6d34",
      },
    ],
    weeklyActivity,
    recentActions: buildAdminRecentActions({ reports, users, articles, announcements }),
    activityTrend,
  };
};

/**
 * Aggregates user dashboard data into a single payload tailored for the intern experience.
 */
export const getUserDashboardData = async () => {
  const results = await Promise.allSettled([
    getCurrentUser(),
    getUserReports(),
    getReports(),
    getAnnouncements(),
    getKnowledgeArticles(),
  ]);

  const [profileResult, userReportsResult, projectResult, announcementsResult, knowledgeResult] =
    results;

  const profile = normalizeDashboardProfile(
    profileResult.status === "fulfilled" ? profileResult.value : null
  );
  const reports =
    userReportsResult.status === "fulfilled"
      ? getDashboardList(userReportsResult.value, ["reports"])
          .map(normalizeDashboardReport)
          .filter(Boolean)
      : [];
  const projectSource = projectResult.status === "fulfilled" ? projectResult.value ?? {} : {};
  const milestones = Array.isArray(projectSource?.milestones)
    ? projectSource.milestones.map(normalizeDashboardMilestone).filter(Boolean)
    : [];
  const analytics = Array.isArray(projectSource?.analytics)
    ? projectSource.analytics
        .map((item, index) => ({
          label: item?.name || `Step ${index + 1}`,
          value: Number.parseFloat(item?.progress) || 0,
        }))
        .filter(item => item.value >= 0)
    : [];
  const distribution = Array.isArray(projectSource?.distribution)
    ? projectSource.distribution
    : [];
  const announcements =
    announcementsResult.status === "fulfilled"
      ? getDashboardList(announcementsResult.value, ["announcements"])
          .map(normalizeDashboardAnnouncement)
          .filter(Boolean)
      : [];
  const articles =
    knowledgeResult.status === "fulfilled"
      ? getDashboardList(knowledgeResult.value, ["articles"])
          .map(normalizeDashboardArticle)
          .filter(Boolean)
      : [];

  const failedSections = results.filter(result => result.status === "rejected").length;

  if (
    failedSections === results.length ||
    (!reports.length && !milestones.length && !announcements.length && !articles.length)
  ) {
    throw new Error("Dashboard data unavailable");
  }

  const completedTasks = milestones.filter(item => item.status === "completed").length;
  const pendingTasks = getDashboardPendingTasks(milestones, reports);
  const reviewedReports = reports.filter(item => item.status === "Reviewed").length;
  const reportScores = reports.map(item => item.score).filter(item => item !== null);
  const avgScore =
    profile.score ??
    (reportScores.length
      ? Number(
          (reportScores.reduce((sum, value) => sum + value, 0) / reportScores.length).toFixed(1)
        )
      : null);
  const attendanceOrReviewRate =
    profile.attendance ??
    (reports.length ? Math.round((reviewedReports / reports.length) * 100) : 0);
  const attendanceLabel = profile.attendance !== null ? "Attendance" : "Review Rate";

  return {
    profile,
    partialData: failedSections > 0,
    heroDate: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    heroSummary: {
      pendingTasks: pendingTasks.length,
      unreadAnnouncements:
        announcements.filter(item => item.pinned || item.priority === "high").length ||
        announcements.length,
    },
    heroChips: [
      {
        value: String(completedTasks),
        label: "Tasks Done",
      },
      {
        value: `${attendanceOrReviewRate}%`,
        label: attendanceLabel,
      },
      {
        value: avgScore !== null ? String(avgScore) : "N/A",
        label: "Score",
      },
    ],
    statCards: [
      {
        title: "Assigned Tasks",
        value: String(milestones.length || reports.length),
        trend: pendingTasks.length > 0 ? `${pendingTasks.length} pending` : undefined,
        color: "#ff6d34",
      },
      {
        title: "Completed",
        value: String(completedTasks || reviewedReports),
        trend: milestones.length > 0 ? `${completedTasks} finished` : `${reviewedReports} reviewed`,
        color: "#00bea3",
      },
      {
        title: attendanceLabel,
        value: `${attendanceOrReviewRate}%`,
        subtitle:
          profile.attendance !== null
            ? "Based on your profile"
            : `${reviewedReports}/${reports.length || 0} reviewed`,
        color: "#ff6d34",
      },
      {
        title: "Performance",
        value: avgScore !== null ? `${avgScore}/10` : "N/A",
        trend: reportScores.length > 0 ? `${reportScores.length} scored reports` : undefined,
        color: "#00bea3",
      },
    ],
    chartActivity:
      analytics.length > 0
        ? analytics
        : buildDashboardDailyCounts(reports, 7).map(item => ({
            label: item.label,
            value: item.count,
          })),
    skillDistribution: getDashboardSkillDistribution(distribution, profile.skills),
    recentActivity: buildUserRecentActivity({ reports, announcements, articles }),
    pendingTasks,
  };
};
