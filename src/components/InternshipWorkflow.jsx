import {
  CheckCircle,
  Circle,
  Calendar,
  User,
  ClipboardList,
  Flag,
  Award,
} from "lucide-react";

const InternshipWorkflow = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-2">Internship Workflow</h2>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const steps = [
    {
      title: "Offer Letter Issued",
      value: data.offerLetterDate,
      status: data.offerLetterDate ? "completed" : "pending",
      icon: <Calendar size={16} />,
    },
    {
      title: "TL Assigned",
      value: data.tlName,
      status: data.tlName ? "completed" : "pending",
      icon: <User size={16} />,
    },
    {
      title: "Internship Started",
      value: data.startDate,
      status: data.startDate ? "completed" : "pending",
      icon: <Calendar size={16} />,
    },
    {
      title: "Tasks Assigned",
      value: `${data.tasksAssigned} Tasks`,
      status:
        data.tasksAssigned > 0
          ? "progress"
          : "pending",
      icon: <ClipboardList size={16} />,
    },
    {
      title: "Task Completed",
      value: `${data.tasksCompleted}/${data.tasksAssigned}`,
      status:
        data.tasksCompleted === data.tasksAssigned &&
        data.tasksAssigned > 0
          ? "completed"
          : "pending",
      icon: <CheckCircle size={16} />,
    },
    {
      title: "Deadline",
      value: data.deadline,
      status: data.deadline ? "pending" : "pending",
      icon: <Flag size={16} />,
    },
    {
      title: "Internship Completed",
      value: data.internshipCompleted
        ? "Completed"
        : "Pending",
      status: data.internshipCompleted
        ? "completed"
        : "pending",
      icon: <CheckCircle size={16} />,
    },
    {
      title: "Certificate Issued",
      value: data.certificateIssued
        ? "Issued"
        : "Pending",
      status: data.certificateIssued
        ? "completed"
        : "pending",
      icon: <Award size={16} />,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-1">
        Internship Progress Tracker
      </h2>

      <p className="text-gray-500 mb-6">
        Track your internship journey and stay updated with your progress.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="border rounded-xl p-4 text-center"
          >
            <div className="flex justify-center mb-3">
              {step.status === "completed" ? (
                <CheckCircle
                  size={34}
                  className="text-green-500"
                />
              ) : step.status === "progress" ? (
                <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>
              ) : (
                <Circle
                  size={34}
                  className="text-gray-300"
                />
              )}
            </div>

            <h3 className="font-semibold text-sm">
              {step.title}
            </h3>

            <div className="flex items-center justify-center gap-1 mt-2 text-sm text-gray-500">
              {step.icon}
              <span>{step.value || "-"}</span>
            </div>

            <div className="mt-3">
              {step.status === "completed" && (
                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                  Completed
                </span>
              )}

              {step.status === "progress" && (
                <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full">
                  In Progress
                </span>
              )}

              {step.status === "pending" && (
                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                  Pending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 border rounded-lg p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          i
        </div>

        <p className="text-sm text-gray-700">
          The progress will be updated as your mentor
          completes each step of your internship.
        </p>
      </div>
    </div>
  );
};

export default InternshipWorkflow;