// ══════════════════════════════════════════════
//  ADMIN — pages/Reports.jsx
// ══════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  FileText,
  Download,
  CheckCircle,
  Clock,
  Star,
  } from "lucide-react";
import { Card, Badge, SectionHeader } from "../../shared/components/UI";
import { EmptyState, ErrorState } from "../../shared/components/AppState";
import { AdminReportsSkeleton } from "../../shared/components/PageSkeletons";
import { approveAdminReport, getAdminReports } from "../../shared/services/api/reportsApi";

const FILTERS = ["All", "Pending", "Reviewed"];

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

const normalizeAdminReport = report => ({
  id: report?.id,
  title: report?.title || "Untitled report",
  intern: report?.intern || report?.internName || report?.user || report?.author || "Unknown Intern",
  date: normalizeReportDate(report?.date || report?.createdAt),
  status: normalizeReportStatus(report?.status),
  score: typeof report?.score === "number" ? report.score : null,
  fileUrl: report?.fileUrl || report?.url || "",
});

const normalizeAdminReportsResponse = response => {
  const items = response?.data || response?.reports || response || [];
  return Array.isArray(items) ? items.map(normalizeAdminReport) : [];
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [pageState, setPageState] = useState("loading");
  const [error, setError] = useState("");
  const [activeReportId, setActiveReportId] = useState(null);

  const fetchReports = async () => getAdminReports();

  useEffect(() => {
    let isActive = true;

    const initializeReports = async () => {
      try {
        const response = await fetchReports();
        if (!isActive) return;

        setReports(normalizeAdminReportsResponse(response));
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
      setReports(normalizeAdminReportsResponse(response));
      setPageState("ready");
    } catch (loadError) {
      setError(loadError.message || "Failed to load reports.");
      setPageState("error");
    }
  };

  const handleApprove = async report => {
    setActiveReportId(report.id);

    try {
      const response = await approveAdminReport(report.id, {
        status: "Reviewed",
        score: report.score ?? 7.5,
      });

      const updated = normalizeAdminReport(response?.data || response);
      setReports(existing => existing.map(item => (item.id === report.id ? updated : item)));
    } catch (approveError) {
      setError(approveError.message || "Failed to approve report.");
      setPageState("error");
    } finally {
      setActiveReportId(null);
    }
  };

  const filtered = useMemo(
    () =>
      reports.filter(report =>
        (filter === "All" || report.status === filter) &&
        (report.title.toLowerCase().includes(search.toLowerCase()) ||
          report.intern.toLowerCase().includes(search.toLowerCase()))
      ),
    [filter, reports, search]
  );

  const pending = reports.filter(report => report.status === "Pending").length;
  const reviewed = reports.filter(report => report.status === "Reviewed").length;

  if (pageState === "loading") {
    return <AdminReportsSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Intern Reports"
          subtitle="Review, approve and manage weekly progress reports"
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
        title="Intern Reports"
        subtitle="Review, approve and manage weekly progress reports"
      />

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          <FileText size={14} /> {reports.length} Total Reports
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
          <Clock size={14} /> {pending} Pending Review
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
          <CheckCircle size={14} /> {reviewed} Reviewed
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search by title or intern name..."
            className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(entry => (
            <button
              key={entry}
              onClick={() => setFilter(entry)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === entry
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(report => (
            <Card key={report.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`p-3 rounded-xl flex-shrink-0 ${
                    report.status === "Reviewed" ? "bg-emerald-50" : "bg-amber-50"
                  }`}>
                    <FileText
                      size={20}
                      className={report.status === "Reviewed" ? "text-emerald-600" : "text-amber-600"}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 break-words">{report.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted by <span className="font-medium text-slate-600">{report.intern}</span> · {report.date}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end flex-shrink-0">
                  <Badge variant={report.status === "Reviewed" ? "success" : "warning"}>
                    {report.status}
                  </Badge>

                  {report.score !== null ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                      <Star size={11} /> {report.score}/10
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApprove(report)}
                      disabled={activeReportId === report.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition disabled:opacity-70"
                    >
                      <CheckCircle size={12} /> {activeReportId === report.id ? "Approving..." : "Approve"}
                    </button>
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
          title="No reports match your search"
          description="Try another filter or wait for report records to arrive through the admin reports API."
        />
      )}
    </div>
  );
};

export default Reports;

