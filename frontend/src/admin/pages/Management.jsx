// ══════════════════════════════════════════════
//  ADMIN — pages/Management.jsx  (Intern Management)
// ══════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  ClipboardList,
  UserPlus,
  Briefcase,
  } from "lucide-react";
import {
  Card,
  Badge,
  SectionHeader,
  Modal,
  Input,
  PrimaryButton,
  GreenButton,
} from "../../shared/components/UI";
import { EmptyState, ErrorState } from "../../shared/components/AppState";
import { AdminManagementSkeleton } from "../../shared/components/PageSkeletons";
import {
  createIntern,
  getInterns,
  updateInternAttendance,
  updateInternStatus,
} from "../../shared/services/api/internsApi";

const normalizeIntern = intern => ({
  id: intern?.id,
  name: intern?.name || "Unknown Intern",
  department: intern?.department || intern?.dept || "General",
  attendance: intern?.attendance || "Present",
  task: intern?.task || intern?.currentTask || "No task assigned",
  rating: intern?.rating ?? 0,
  status: intern?.status || "Active",
});

const normalizeInternsResponse = response => {
  const items = response?.data || response?.items || response || [];
  return Array.isArray(items) ? items.map(normalizeIntern) : [];
};

const Management = () => {
  const [interns, setInterns] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newIntern, setNewIntern] = useState({ name: "", department: "", task: "" });
  const [pageState, setPageState] = useState("loading");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeActionId, setActiveActionId] = useState(null);

  const fetchInterns = async () => {
    return getInterns();
  };

  useEffect(() => {
    let isActive = true;

    const initializeInterns = async () => {
      try {
        const response = await fetchInterns();
        if (!isActive) return;

        setInterns(normalizeInternsResponse(response));
        setPageState("ready");
      } catch (loadError) {
        if (!isActive) return;

        setError(loadError.message || "Failed to load intern data.");
        setPageState("error");
      }
    };

    initializeInterns();

    return () => {
      isActive = false;
    };
  }, []);

  const handleRetry = async () => {
    setPageState("loading");
    setError("");

    try {
      const response = await fetchInterns();
      setInterns(normalizeInternsResponse(response));
      setPageState("ready");
    } catch (loadError) {
      setError(loadError.message || "Failed to load intern data.");
      setPageState("error");
    }
  };

  const filtered = useMemo(
    () =>
      interns.filter(intern =>
        intern.name.toLowerCase().includes(search.toLowerCase()) ||
        intern.department.toLowerCase().includes(search.toLowerCase())
      ),
    [interns, search]
  );

  const handleAddIntern = async () => {
    if (!newIntern.name.trim() || !newIntern.department.trim()) {
      setFormError("Name and department are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await createIntern({
        name: newIntern.name.trim(),
        department: newIntern.department.trim(),
        task: newIntern.task.trim(),
      });

      setInterns(existing => [normalizeIntern(response?.data || response), ...existing]);
      setIsModalOpen(false);
      setNewIntern({ name: "", department: "", task: "" });
    } catch (createError) {
      setFormError(createError.message || "Failed to create intern.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAttendance = async id => {
    setActiveActionId(id);

    try {
      const response = await updateInternAttendance(id);
      const updatedIntern = normalizeIntern(response?.data || response);
      setInterns(existing => existing.map(intern => (intern.id === id ? updatedIntern : intern)));
    } catch (updateError) {
      setError(updateError.message || "Failed to update attendance.");
      setPageState("error");
    } finally {
      setActiveActionId(null);
    }
  };

  const toggleStatus = async id => {
    setActiveActionId(id);

    try {
      const response = await updateInternStatus(id);
      const updatedIntern = normalizeIntern(response?.data || response);
      setInterns(existing => existing.map(intern => (intern.id === id ? updatedIntern : intern)));
    } catch (updateError) {
      setError(updateError.message || "Failed to update status.");
      setPageState("error");
    } finally {
      setActiveActionId(null);
    }
  };

  if (pageState === "loading") {
    return <AdminManagementSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Intern Management"
          subtitle="Manage intern attendance, tasks, status and ratings"
        />
        <ErrorState
          title="Could not load intern records"
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

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Intern Management"
        subtitle="Manage intern attendance, tasks, status and ratings"
        action={
          <PrimaryButton icon={UserPlus} onClick={() => setIsModalOpen(true)}>
            Add Intern
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Interns",
            value: interns.length,
            bg: "bg-blue-50",
            text: "text-blue-700",
          },
          {
            label: "Present Today",
            value: interns.filter(intern => intern.attendance === "Present").length,
            bg: "bg-emerald-50",
            text: "text-emerald-700",
          },
          {
            label: "Absent Today",
            value: interns.filter(intern => intern.attendance === "Absent").length,
            bg: "bg-red-50",
            text: "text-red-700",
          },
          {
            label: "Active Status",
            value: interns.filter(intern => intern.status === "Active").length,
            bg: "bg-violet-50",
            text: "text-violet-700",
          },
        ].map(summary => (
          <div key={summary.label} className={`${summary.bg} ${summary.text} rounded-xl p-4`}>
            <p className="text-2xl font-bold">{summary.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{summary.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search interns by name or department..."
          className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[52rem]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Name", "Department", "Attendance", "Current Task", "Rating", "Status", "Actions"].map(header => (
                  <th
                    key={header}
                    className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${header === "Actions" ? "text-center" : "text-left"}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(intern => (
                <tr key={intern.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4 font-medium text-slate-900 whitespace-nowrap">{intern.name}</td>
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{intern.department}</td>
                  <td className="px-5 py-4">
                    <Badge variant={intern.attendance === "Present" ? "success" : "danger"}>
                      {intern.attendance}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-slate-600 whitespace-nowrap">
                      <ClipboardList size={13} className="flex-shrink-0 text-slate-400" />
                      {intern.task}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      ⭐ {intern.rating} / 10
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={intern.status === "Active" ? "purple" : "gray"}>
                      {intern.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => toggleAttendance(intern.id)}
                        title="Toggle Attendance"
                        disabled={activeActionId === intern.id}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        onClick={() => toggleStatus(intern.id)}
                        title="Toggle Active Status"
                        disabled={activeActionId === intern.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && interns.length > 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No interns match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {interns.length === 0 && (
        <EmptyState
          title="No interns found"
          description="Create the first intern record once the intern management API starts returning data."
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
            >
              Add First Intern
            </button>
          }
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Intern"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <GreenButton onClick={handleAddIntern}>
              {isSubmitting ? "Creating..." : "Create Intern"}
            </GreenButton>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            icon={UserPlus}
            value={newIntern.name}
            onChange={event => setNewIntern({ ...newIntern, name: event.target.value })}
          />
          <Input
            label="Department"
            placeholder="e.g. Web Development"
            icon={Briefcase}
            value={newIntern.department}
            onChange={event => setNewIntern({ ...newIntern, department: event.target.value })}
          />
          <Input
            label="Current Task"
            placeholder="e.g. Dashboard Refactor"
            icon={ClipboardList}
            value={newIntern.task}
            onChange={event => setNewIntern({ ...newIntern, task: event.target.value })}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
      </Modal>
    </div>
  );
};

export default Management;

