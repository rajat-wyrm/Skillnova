import { getAnnouncements } from "./announcementsApi";
import { getAdminKnowledgeArticles, getKnowledgeArticles } from "./knowledgeApi";
import { getInterns } from "./internsApi";
import { getReports, getAdminReports, getUserReports } from "./reportsApi";
import { getCurrentUser } from "./usersApi";
import {
  buildAdminTaskSummary,
  buildDashboardDailyCounts,
  buildDashboardDepartmentDistribution,
  buildDashboardMonthlyCounts,
  buildDashboardWeeklyReportCounts,
  buildUserStrengths,
  buildUserTaskProgress,
  getDashboardList,
  getDashboardSkillDistribution,
  normalizeDashboardAnnouncement,
  normalizeDashboardArticle,
  normalizeDashboardIntern,
  normalizeDashboardProfile,
  normalizeDashboardReport,
} from "./insightsHelpers";

/**
 * Aggregates admin analytics data so charts can render from one stable service contract.
 */
export const getAdminAnalyticsData = async () => {
  const results = await Promise.allSettled([
    getInterns(),
    getAdminReports(),
    getAdminKnowledgeArticles(),
    getAnnouncements(),
  ]);

  const [internsResult, reportsResult, articlesResult, announcementsResult] = results;

  const interns =
    internsResult.status === "fulfilled"
      ? getDashboardList(internsResult.value).map(normalizeDashboardIntern).filter(Boolean)
      : [];
  const reports =
    reportsResult.status === "fulfilled"
      ? getDashboardList(reportsResult.value, ["reports"])
          .map(normalizeDashboardReport)
          .filter(Boolean)
      : [];
  const articles =
    articlesResult.status === "fulfilled"
      ? getDashboardList(articlesResult.value, ["articles"])
          .map(normalizeDashboardArticle)
          .filter(Boolean)
      : [];
  const announcements =
    announcementsResult.status === "fulfilled"
      ? getDashboardList(announcementsResult.value, ["announcements"])
          .map(normalizeDashboardAnnouncement)
          .filter(Boolean)
      : [];

  const failedSections = results.filter(result => result.status === "rejected").length;

  if (failedSections === results.length || (!interns.length && !reports.length && !articles.length)) {
    throw new Error("Analytics data unavailable");
  }

  const scoredInterns = interns.map(item => item.rating).filter(item => item !== null);
  const reviewedReports = reports.filter(item => item.status === "Reviewed").length;
  const answeredRate = reports.length ? Math.round((reviewedReports / reports.length) * 100) : 0;
  const avgPerformance = scoredInterns.length
    ? (scoredInterns.reduce((sum, value) => sum + value, 0) / scoredInterns.length).toFixed(1)
    : "0.0";

  return {
    partialData: failedSections > 0,
    statCards: [
      {
        title: "Total Reports",
        value: String(reports.length),
        trend: `${reviewedReports} reviewed`,
        color: "#2563EB",
      },
      {
        title: "Avg Performance",
        value: `${avgPerformance}/10`,
        trend: `${interns.length} interns tracked`,
        color: "#7C3AED",
      },
      {
        title: "KB Articles",
        value: String(articles.length),
        trend: `${articles.filter(item => item.verified).length} verified`,
        color: "#059669",
      },
      {
        title: "Questions Answered",
        value: `${answeredRate}%`,
        trend: `${announcements.length} announcements`,
        color: "#D97706",
      },
    ],
    performanceData: interns.map(intern => ({
      name: intern.name.split(" ")[0] || intern.name,
      score: intern.rating ?? 0,
    })),
    departmentData: buildDashboardDepartmentDistribution(interns),
    weeklyReports: buildDashboardWeeklyReportCounts(reports, 4),
    activityTrend: buildDashboardDailyCounts(
      [
        ...reports.map(item => ({ timestamp: item.timestamp })),
        ...articles.map(item => ({ timestamp: item.timestamp })),
        ...announcements.map(item => ({ timestamp: item.timestamp })),
      ].filter(item => item.timestamp),
      7
    ).map(item => ({
      day: item.label,
      activity: item.count,
    })),
    taskSummary: buildAdminTaskSummary(interns, reports),
  };
};

/**
 * Aggregates intern analytics data into chart-ready and card-ready structures.
 */
export const getUserAnalyticsData = async () => {
  const results = await Promise.allSettled([
    getCurrentUser(),
    getUserReports(),
    getReports(),
    getKnowledgeArticles(),
  ]);

  const [profileResult, reportsResult, projectResult, knowledgeResult] = results;

  const profile = normalizeDashboardProfile(
    profileResult.status === "fulfilled" ? profileResult.value : null
  );
  const reports =
    reportsResult.status === "fulfilled"
      ? getDashboardList(reportsResult.value, ["reports"])
          .map(normalizeDashboardReport)
          .filter(Boolean)
      : [];
  const projectSource = projectResult.status === "fulfilled" ? projectResult.value ?? {} : {};
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
  const articles =
    knowledgeResult.status === "fulfilled"
      ? getDashboardList(knowledgeResult.value, ["articles"])
          .map(normalizeDashboardArticle)
          .filter(Boolean)
      : [];

  const failedSections = results.filter(result => result.status === "rejected").length;

  if (
    failedSections === results.length ||
    (!reports.length && !analytics.length && !distribution.length && !articles.length)
  ) {
    throw new Error("Analytics data unavailable");
  }

  const skillDistribution = getDashboardSkillDistribution(distribution, profile.skills);
  const taskProgress = buildUserTaskProgress(analytics, skillDistribution, reports);
  const completedReports = reports.filter(item => item.status === "Reviewed").length;
  const performanceScore =
    profile.score !== null
      ? Math.round(Math.min(100, profile.score * 10))
      : reports.length
        ? Math.round((completedReports / reports.length) * 100)
        : 0;
  const currentMonthReports = buildDashboardMonthlyCounts(reports, 1)[0]?.count ?? 0;
  const monthlyTrend = buildDashboardMonthlyCounts(reports, 6).map((item, index) => {
    const relatedProgress = analytics[index]?.value ?? performanceScore / 2;
    return {
      month: item.label,
      activity: Number((item.count * 3 + relatedProgress / 10).toFixed(1)),
      tasks: item.count,
    };
  });
  const weeklyActivity = buildDashboardDailyCounts(
    [
      ...reports.map(item => ({ timestamp: item.timestamp })),
      ...articles.map(item => ({ timestamp: item.timestamp })),
    ].filter(item => item.timestamp),
    7
  ).map(item => ({
    day: item.label,
    activity: item.count,
  }));
  const strengths = buildUserStrengths(skillDistribution, profile, reports);

  return {
    partialData: failedSections > 0,
    heroChips: [
      { value: `${performanceScore}%`, label: "Performance" },
      { value: String(currentMonthReports), label: "This Month" },
      { value: String(completedReports), label: "Tasks Done" },
      {
        value:
          profile.score !== null
            ? profile.score.toFixed(1)
            : reports.length
              ? (
                  reports
                    .map(item => item.score)
                    .filter(item => item !== null)
                    .reduce((sum, value) => sum + value, 0) /
                  Math.max(
                    1,
                    reports.map(item => item.score).filter(item => item !== null).length
                  )
                ).toFixed(1)
              : "0.0",
        label: "Avg Rating",
      },
    ],
    statCards: [
      {
        title: "Tasks Completed",
        value: String(completedReports),
        trend: `${reports.length} reports total`,
        color: "#00bea3",
      },
      {
        title: "Learning Activity",
        value: `${Number(monthlyTrend.reduce((sum, item) => sum + item.activity, 0).toFixed(1))}`,
        trend: `${currentMonthReports} this month`,
        color: "#ff6d34",
      },
      {
        title: "Performance",
        value: `${performanceScore}%`,
        trend: profile.score !== null ? `${profile.score.toFixed(1)}/10 score` : undefined,
        color: "#7c3aed",
      },
      {
        title: "Active Skills",
        value: String(skillDistribution.length || profile.skills.length),
        subtitle: "Tracked from profile",
        color: "#f59e0b",
      },
    ],
    monthlyTrend,
    performanceScore,
    skillDistribution,
    taskProgress,
    strengths,
    weeklyActivity,
  };
};

