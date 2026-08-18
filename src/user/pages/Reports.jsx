import { useEffect, useState } from "react";
import { Search, FileText, Upload, Loader2 } from "lucide-react";
import { Card, Badge, SectionHeader, Input, GreenButton, Modal } from "../../shared/components/UI";
import api from "../../lib/api";
import notify from "../../lib/toast";
import { formatDate } from "../../lib/utils";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", weekNumber: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reports", { params: { limit: 50 } });
      setReports(data.items || []);
    } catch (error) {
      notify.error(error.response?.data?.error || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReports(); }, []);

  const filtered = reports.filter((report) =>
    !search || report.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const submit = async () => {
    if (!form.title.trim()) {
      notify.error("Please add a title.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/reports", {
        title: form.title.trim(),
        content: form.content.trim() || undefined,
        weekNumber: form.weekNumber ? Number(form.weekNumber) : undefined,
      });
      notify.success("Report submitted!");
      setIsModalOpen(false);
      setForm({ title: "", content: "", weekNumber: "" });
      await loadReports();
    } catch (error) {
      notify.error(error.response?.data?.error || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Reports"
        subtitle="View and manage your weekly progress reports"
        action={<button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: "#ff6d34" }}><Upload size={15} /> Submit Report</button>}
      />

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports…" className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
      </div>

      <div className="space-y-3">
        {filtered.map((report) => (
          <Card key={report.id} hover className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-3 rounded-xl flex-shrink-0"><FileText size={20} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white break-words">{report.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Week {report.weekNumber ?? "—"} · Submitted {formatDate(report.submittedAt)}</p>
                  {report.feedback && <p className="text-xs mt-1 italic">“{report.feedback}”</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={report.status === "REVIEWED" ? "success" : report.status === "REJECTED" ? "danger" : "warning"}>{report.status}</Badge>
                {report.score != null && <span className="text-sm font-bold">{report.score}/10</span>}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center py-16 text-slate-400"><FileText size={40} className="mx-auto mb-3 opacity-30" /><p>No reports found.</p></div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Progress Report" footer={<><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm">Cancel</button><GreenButton onClick={submit}>{submitting ? "Submitting…" : "Submit Report"}</GreenButton></>}>
        <div className="space-y-4">
          <Input label="Report Title" placeholder="e.g. Week 4 Progress Report" icon={FileText} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <Input label="Week number" type="number" min={1} max={52} value={form.weekNumber} onChange={(event) => setForm({ ...form, weekNumber: event.target.value })} />
          <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={8} placeholder="Goals · Completed · Blockers · Learnings · Next steps" className="w-full px-4 py-2.5 text-sm rounded-xl border" />
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
