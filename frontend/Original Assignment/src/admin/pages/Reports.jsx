// ══════════════════════════════════════════════
//  ADMIN — pages/Reports.jsx
// ══════════════════════════════════════════════

import { useState } from "react";
import { Search, FileText, Download, CheckCircle, Clock, Star } from "lucide-react";
import { Card, Badge, SectionHeader } from "../../shared/components/UI";
import { MOCK_REPORTS } from "../../shared/utils/constants";

const FILTERS = ["All", "Pending", "Reviewed"];

const Reports = () => {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("All");

  const approveReport = id =>
    setReports(rs => rs.map(r => r.id === id ? { ...r, status: "Reviewed", score: r.score ?? 7.5 } : r));

  const filtered = reports.filter(r =>
    (filter === "All" || r.status === filter) &&
    (r.title.toLowerCase().includes(search.toLowerCase()) ||
     r.intern.toLowerCase().includes(search.toLowerCase()))
  );

  const pending  = reports.filter(r => r.status === "Pending").length;
  const reviewed = reports.filter(r => r.status === "Reviewed").length;

  return (
    <div className="space-y-6">

      <SectionHeader
        title="Intern Reports"
        subtitle="Review, approve and manage weekly progress reports"
      />

      {/* Summary Chips */}
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

      {/* Search + Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or intern name…"
            className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards */}
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

                {report.score ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Star size={11} /> {report.score}/10
                  </span>
                ) : (
                  <button
                    onClick={() => approveReport(report.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                  >
                    <CheckCircle size={12} /> Approve
                  </button>
                )}

                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200 transition">
                  <Download size={13} /> Download
                </button>
              </div>

            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>No reports match your search.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;