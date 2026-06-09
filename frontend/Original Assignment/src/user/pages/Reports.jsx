// ══════════════════════════════════════════════
//  USER — pages/Reports.jsx
// ══════════════════════════════════════════════

import { useState } from "react";
import { Search, Upload, FileText, Download, CloudUpload } from "lucide-react";
import { Card, Badge, SectionHeader, Modal, Input, PrimaryButton, GreenButton } from "../../shared/components/UI";
import { MOCK_REPORTS } from "../../shared/utils/constants";

const Reports = () => {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [search, setSearch]   = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState("");

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.intern.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = () => {
    if (!newReportTitle) return;
    const report = {
      id: Date.now(),
      title: newReportTitle,
      intern: "Rahul Sharma",
      date: new Date().toLocaleDateString('en-GB'),
      status: "Pending",
    };
    setReports([report, ...reports]);
    setIsModalOpen(false);
    setNewReportTitle("");
  };

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

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search reports…"
          className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      {/* List */}
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
                {report.score && (
                  <span className="text-sm font-bold text-slate-700">{report.score}/10</span>
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
            <p>No reports found.</p>
          </div>
        )}
      </div>

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
              Submit Report
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
            onChange={e => setNewReportTitle(e.target.value)}
          />
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors bg-slate-50 cursor-pointer group">
            <CloudUpload size={40} className="mx-auto text-slate-300 group-hover:text-blue-500 transition-colors mb-2" />
            <p className="text-sm font-medium text-slate-900">Click to select file or drag and drop</p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX up to 10MB</p>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Reports;