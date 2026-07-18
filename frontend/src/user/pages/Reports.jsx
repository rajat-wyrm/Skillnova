// ══════════════════════════════════════════════
//  USER — pages/Reports.jsx
// ══════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Upload,
  FileText,
  Download,
  CloudUpload,
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
import { UserReportsSkeleton } from "../../shared/components/PageSkeletons";
import { createUserReport, getUserReports } from "../../shared/services/api/reportsApi";

const normalizeReportStatus = value => {
  const raw = String(value || "Pending").toLowerCase();
  return raw === "reviewed" ? "Reviewed" : "Pending";
};

const normalizeReportDate = value => {
  if (!value) {
    return "Recently submitted";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeUserReport = report => ({
  id: report?.id,
  title: report?.title || "Untitled report",
  intern: report?.intern || report?.internName || report?.user || report?.author || "You",
  date: normalizeReportDate(report?.date || report?.createdAt),
  status: normalizeReportStatus(report?.status),
  score: typeof report?.score === "number" ? report.score : null,
  fileUrl: report?.fileUrl || report?.url || "",
});

const normalizeUserReportsResponse = response => {
  const items = response?.data || response?.reports || response || [];
  return Array.isArray(items) ? items.map(normalizeUserReport) : [];
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState("");
  const [pageState, setPageState] = useState("loading");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReports = async () => getUserReports();

  useEffect(() => {
    let isActive = true;

    const initializeReports = async () => {
      try {
        const response = await fetchReports();
        if (!isActive) return;

        setReports(normalizeUserReportsResponse(response));
        setPageState("ready");
      } catch (loadError) {
        if (!isActive) return;

        setError(loadError.message || "Failed to load reports.");
        setPageState("error");
      }
    };

    initializeReports();

    return () => {
      isActive = false;
    };
  }, []);

  const handleRetry = async () => {
    setPageState("loading");
    setError("");

    try {
      const response = await fetchReports();
      setReports(normalizeUserReportsResponse(response));
      setPageState("ready");
    } catch (loadError) {
      setError(loadError.message || "Failed to load reports.");
      setPageState("error");
    }
  };

  const handleUpload = async () => {
    if (!newReportTitle.trim()) {
      setFormError("Report title is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await createUserReport({
        title: newReportTitle.trim(),
      });

      setReports(existing => [normalizeUserReport(response?.data || response), ...existing]);
      setIsModalOpen(false);
      setNewReportTitle("");
    } catch (createError) {
      setFormError(createError.message || "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(
    () =>
      reports.filter(report =>
        report.title.toLowerCase().includes(search.toLowerCase()) ||
        report.intern.toLowerCase().includes(search.toLowerCase())
      ),
    [reports, search]
  );

  if (pageState === "loading") {
    return <UserReportsSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="My Reports"
          subtitle="View and manage your weekly progress reports"
        />
        <ErrorState
          title="Could not load reports"
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
        title="My Reports"
        subtitle="View and manage your weekly progress reports"
        action={
          <PrimaryButton icon={Upload} onClick={() => setIsModalOpen(true)}>
            Upload Report
          </PrimaryButton>
        }
      />

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search reports..."
          className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(report => (
            <Card key={report.id} hover className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="p-3 rounded-xl bg-blue-50 flex-shrink-0">
                    <FileText size={20} className="text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 break-words">{report.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted by {report.intern} · {report.date}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0 sm:justify-end">
                  <Badge variant={report.status === "Reviewed" ? "success" : "warning"}>
                    {report.status}
                  </Badge>
                  {report.score !== null && (
                    <span className="text-sm font-bold text-slate-700">{report.score}/10</span>
                  )}
                  <button
                    disabled={!report.fileUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200 transition disabled:opacity-60"
                  >
                    <Download size={13} /> Download
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No reports found"
          description="Upload your first report or try another search term once report records are available through the user reports API."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Progress Report"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <GreenButton onClick={handleUpload}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </GreenButton>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Report Title"
            placeholder="e.g. Weekly Progress - Phase 2"
            icon={FileText}
            value={newReportTitle}
            onChange={event => setNewReportTitle(event.target.value)}
          />
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50">
            <CloudUpload size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-900">File upload will connect here when the reports API accepts file metadata.</p>
            <p className="text-xs text-slate-500 mt-1">The page is already wired to the centralized report creation contract.</p>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
      </Modal>
    </div>
  );
};

export default Reports;


