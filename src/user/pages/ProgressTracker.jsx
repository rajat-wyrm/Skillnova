import { useEffect, useState } from "react";
import {
  Target,
  CheckCircle2,
  FileText,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  Trophy,
  BarChart3,
} from "lucide-react";

export default function ProgressTracker() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ═══════════════════════════════════════════
  // Fetch Progress Data From Backend
  // ═══════════════════════════════════════════

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/v1/progress",
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch progress");
        }

        const data = await response.json();

        setProgress(data);
      } catch (err) {
        console.error("Progress error:", err);

        setError(
          "Unable to load progress data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  // ═══════════════════════════════════════════
  // Loading State
  // ═══════════════════════════════════════════

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading your progress...</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Error State
  // ═══════════════════════════════════════════

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">
          {error}
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Progress Level
  // ═══════════════════════════════════════════

  const getProgressLevel = (percentage) => {
    if (percentage >= 100) {
      return "Completed";
    }

    if (percentage >= 76) {
      return "Almost There";
    }

    if (percentage >= 51) {
      return "Good Progress";
    }

    if (percentage >= 26) {
      return "Making Progress";
    }

    return "Getting Started";
  };

  const progressLevel =
    getProgressLevel(
      progress.overallProgress
    );

  // ═══════════════════════════════════════════
  // Progress Areas
  // ═══════════════════════════════════════════

  const progressAreas = [
    {
      name: "Task Completion",
      percentage:
        progress.tasks.percentage,
    },
    {
      name: "Reports",
      percentage:
        progress.reports.percentage,
    },
    {
      name: "Attendance",
      percentage:
        progress.attendance.percentage,
    },
    {
      name: "Performance Score",
      percentage:
        progress.score.percentage,
    },
  ];

  // ═══════════════════════════════════════════
  // Find Weakest Area
  // ═══════════════════════════════════════════

  const weakestArea =
    progressAreas.reduce(
      (lowest, current) =>
        current.percentage <
        lowest.percentage
          ? current
          : lowest
    );

  // ═══════════════════════════════════════════
  // Next Milestone
  // ═══════════════════════════════════════════

  const getNextMilestone = (
    percentage
  ) => {
    if (percentage < 25) {
      return 25;
    }

    if (percentage < 50) {
      return 50;
    }

    if (percentage < 75) {
      return 75;
    }

    if (percentage < 100) {
      return 100;
    }

    return 100;
  };

  const nextMilestone =
    getNextMilestone(
      progress.overallProgress
    );

  // ═══════════════════════════════════════════
  // Recommended Next Action
  // ═══════════════════════════════════════════

  const getRecommendation = () => {

    // If Tasks are weakest
    if (
      weakestArea.name ===
      "Task Completion"
    ) {
      const remainingTasks =
        progress.tasks.total -
        progress.tasks.completed;

      return {
        title:
          "Complete Pending Tasks",

        message:
          `You have ${remainingTasks} tasks remaining. ` +
          `Completing more tasks will have the biggest impact ` +
          `because tasks contribute 40% to your overall progress.`,
      };
    }

    // If Reports are weakest
    if (
      weakestArea.name ===
      "Reports"
    ) {
      const remainingReports =
        progress.reports.total -
        progress.reports.reviewed;

      return {
        title:
          "Focus on Your Reports",

        message:
          `You have ${remainingReports} reports that are not yet reviewed. ` +
          `Work on completing and submitting your reports ` +
          `to improve your overall progress.`,
      };
    }

    // If Attendance is weakest
    if (
      weakestArea.name ===
      "Attendance"
    ) {
      return {
        title:
          "Improve Your Attendance",

        message:
          `Your attendance is currently ${progress.attendance.percentage}%. ` +
          `Maintain regular attendance to improve ` +
          `your overall progress.`,
      };
    }

    // If Performance is weakest
    if (
      weakestArea.name ===
      "Performance Score"
    ) {
      return {
        title:
          "Improve Your Performance",

        message:
          `Your current average score is ${progress.score.average}/10. ` +
          `Focus on improving the quality of your tasks ` +
          `and reports to increase your performance score.`,
      };
    }

    return {
      title:
        "Keep Learning",

      message:
        "Continue completing tasks and maintaining consistent performance.",
    };
  };

  const recommendation =
    getRecommendation();

  // ═══════════════════════════════════════════
  // UI
  // ═══════════════════════════════════════════

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════════
          Page Header
      ══════════════════════════════════════ */}

      <div>
        <h1 className="text-2xl font-bold">
          My Learning Progress
        </h1>

        <p className="text-gray-500 mt-1">
          Track your internship learning
          journey and overall performance.
        </p>
      </div>

      {/* ══════════════════════════════════════
          Overall Progress
      ══════════════════════════════════════ */}

      <div className="bg-white rounded-xl p-6 shadow-sm">

        <div className="flex items-center gap-3 mb-4">

          <div className="p-3 rounded-lg bg-orange-100">

            <TrendingUp
              size={24}
              className="text-orange-500"
            />

          </div>

          <div>

            <h2 className="text-lg font-semibold">
              Overall Progress
            </h2>

            <p className="text-sm text-gray-500">
              Your overall internship
              performance
            </p>

          </div>

        </div>

        <div className="flex items-end gap-3 mb-3">

          <span className="text-4xl font-bold">

            {progress.overallProgress}%

          </span>

          <span className="text-green-600 font-medium mb-1">

            {progressLevel}

          </span>

        </div>

        {/* Overall Progress Bar */}

        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">

          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-700"
            style={{
              width:
                `${progress.overallProgress}%`,
            }}
          />

        </div>

      </div>

      {/* ══════════════════════════════════════
          Individual Progress Cards
      ══════════════════════════════════════ */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <ProgressCard
          title="Task Progress"
          percentage={
            progress.tasks.percentage
          }
          details={
            `${progress.tasks.completed} of ${progress.tasks.total} completed`
          }
          icon={CheckCircle2}
        />

        <ProgressCard
          title="Report Progress"
          percentage={
            progress.reports.percentage
          }
          details={
            `${progress.reports.reviewed} of ${progress.reports.total} reviewed`
          }
          icon={FileText}
        />

        <ProgressCard
          title="Attendance"
          percentage={
            progress.attendance.percentage
          }
          details={
            `${progress.attendance.present} of ${progress.attendance.total} days present`
          }
          icon={CalendarCheck}
        />

        <ProgressCard
          title="Performance Score"
          percentage={
            progress.score.percentage
          }
          details={
            `${progress.score.average} / 10 average score`
          }
          icon={BarChart3}
        />

      </div>

      {/* ══════════════════════════════════════
          Weak Area + Next Milestone
      ══════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Weak Area */}

        <div className="bg-white rounded-xl p-6 shadow-sm">

          <div className="flex items-center gap-3 mb-4">

            <div className="p-2 rounded-lg bg-yellow-100">

              <AlertTriangle
                size={22}
                className="text-yellow-600"
              />

            </div>

            <h2 className="text-lg font-semibold">
              Needs Attention
            </h2>

          </div>

          <p className="text-gray-600">
            Your weakest area is currently
          </p>

          <p className="text-xl font-bold mt-2">

            {weakestArea.name}

          </p>

          <p className="text-orange-500 font-semibold mt-1">

            {weakestArea.percentage}%

          </p>

          <p className="text-sm text-gray-500 mt-3">

            Focus on improving this area
            to increase your overall
            progress.

          </p>

        </div>

        {/* Next Milestone */}

        <div className="bg-white rounded-xl p-6 shadow-sm">

          <div className="flex items-center gap-3 mb-4">

            <div className="p-2 rounded-lg bg-green-100">

              <Trophy
                size={22}
                className="text-green-600"
              />

            </div>

            <h2 className="text-lg font-semibold">
              Next Milestone
            </h2>

          </div>

          {progress.overallProgress >= 100 ? (

            <p className="text-lg font-semibold">

              Congratulations! You have
              reached 100% progress.

            </p>

          ) : (

            <>

              <p className="text-gray-600">

                Your next progress
                milestone is

              </p>

              <p className="text-3xl font-bold mt-2">

                {nextMilestone}%

              </p>

              <p className="text-sm text-gray-500 mt-3">

                You need{" "}

                {nextMilestone -
                  progress.overallProgress}

                % more overall progress
                to reach this milestone.

              </p>

            </>

          )}

        </div>

      </div>

      {/* ══════════════════════════════════════
          Recommended Next Action
      ══════════════════════════════════════ */}

      <div className="bg-white rounded-xl p-6 shadow-sm">

        <div className="flex items-center gap-3 mb-4">

          <div className="p-2 rounded-lg bg-blue-100">

            <Target
              size={22}
              className="text-blue-600"
            />

          </div>

          <div>

            <h2 className="text-lg font-semibold">

              Recommended Next Action

            </h2>

            <p className="text-sm text-gray-500">

              Based on your current
              progress

            </p>

          </div>

        </div>

        <h3 className="text-xl font-bold">

          {recommendation.title}

        </h3>

        <p className="text-gray-600 mt-2">

          {recommendation.message}

        </p>

      </div>

      {/* ══════════════════════════════════════
          Progress Calculation
      ══════════════════════════════════════ */}

      <div className="bg-white rounded-xl p-6 shadow-sm">

        <div className="flex items-center gap-3 mb-5">

          <Target
            size={22}
            className="text-orange-500"
          />

          <div>

            <h2 className="text-lg font-semibold">

              Progress Calculation

            </h2>

            <p className="text-sm text-gray-500">

              How your overall progress
              is calculated

            </p>

          </div>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <WeightCard
            title="Tasks"
            weight="40%"
          />

          <WeightCard
            title="Reports"
            weight="20%"
          />

          <WeightCard
            title="Attendance"
            weight="20%"
          />

          <WeightCard
            title="Performance"
            weight="20%"
          />

        </div>

      </div>

    </div>
  );
}


// ═══════════════════════════════════════════
// Progress Card Component
// ═══════════════════════════════════════════

function ProgressCard({
  title,
  percentage,
  details,
  icon: Icon,
}) {

  return (

    <div className="bg-white rounded-xl p-5 shadow-sm">

      <div className="flex items-center justify-between mb-4">

        <div className="p-2 rounded-lg bg-orange-100">

          <Icon
            size={20}
            className="text-orange-500"
          />

        </div>

        <span className="text-xl font-bold">

          {percentage}%

        </span>

      </div>

      <h3 className="font-semibold">

        {title}

      </h3>

      {/* Progress Bar */}

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-3">

        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-500"
          style={{
            width:
              `${percentage}%`,
          }}
        />

      </div>

      <p className="text-sm text-gray-500 mt-3">

        {details}

      </p>

    </div>

  );
}


// ═══════════════════════════════════════════
// Weight Card Component
// ═══════════════════════════════════════════

function WeightCard({
  title,
  weight,
}) {

  return (

    <div className="border rounded-lg p-4">

      <p className="text-sm text-gray-500">

        {title}

      </p>

      <p className="text-2xl font-bold mt-1">

        {weight}

      </p>

      <p className="text-xs text-gray-400 mt-1">

        Overall weight

      </p>

    </div>

  );
}