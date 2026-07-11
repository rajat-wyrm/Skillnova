
// User - pages/Reports.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  FileText,
  History,
  Loader2,
  PencilLine,
  RefreshCw,
  Send,
  Sparkles,
  Star,
} from 'lucide-react';
import { Card, Badge, SectionHeader, Input, GreenButton, Modal } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate, formatRelative } from '../../lib/utils';
import { getReportStatusLabel, reportBadgeVariant, ratingToStars, formatRating } from '../../shared/config/reports';

const emptyLogForm = {
  workDone: '',
  hoursWorked: '',
  technologiesUsed: '',
  challenges: '',
  tomorrowPlan: '',
};

const emptyReportForm = {
  title: '',
  content: '',
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingLog, setSavingLog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTitle, setHistoryTitle] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const [logEditor, setLogEditor] = useState(null);
  const [logForm, setLogForm] = useState(emptyLogForm);
  const [reportForm, setReportForm] = useState(emptyReportForm);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, logsRes, currentRes] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/reports', { params: { limit: 50, sort: 'submittedAt', order: 'desc' } }),
        api.get('/reports/daily-logs'),
        api.get('/reports/current-week'),
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data.items || []);
      setDailyLogs(logsRes.data.items || []);
      setCurrentWeek(currentRes.data);
      const initialReport = currentRes.data?.report || null;
      if (initialReport?.id) {
        setReportForm({
          title: initialReport.title || '',
          content: initialReport.content || '',
        });
      }
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentReport = currentWeek?.report || null;
  const currentPreview = currentWeek?.preview || null;
  const todayLog = currentWeek?.todayLog || dailyLogs.find((item) => item.date?.slice(0, 10) === todayKey()) || null;
  const needsReminder = currentWeek?.missingToday ?? !todayLog;
  const editableReport = currentReport && ['DRAFT', 'NEEDS_REVISION'].includes(currentReport.status);
  const weeklySummary = currentReport?.summary || currentPreview?.summary || {
    totalHours: 0,
    challenges: [],
    achievements: [],
    technologies: [],
    nextSteps: [],
  };


  const openLogEditor = (log) => {
    setLogEditor(log);
    setLogForm({
      workDone: log.workDone || '',
      hoursWorked: log.hoursWorked ?? '',
      technologiesUsed: log.technologiesUsed || '',
      challenges: log.challenges || '',
      tomorrowPlan: log.tomorrowPlan || '',
    });
  };

  const clearLogEditor = () => {
    setLogEditor(null);
    setLogForm(emptyLogForm);
  };

  const saveLog = async () => {
    if (!logForm.workDone.trim()) {
      notify.error('Please add what you worked on today.');
      return;
    }
    setSavingLog(true);
    try {
      const payload = {
        date: logEditor?.date || new Date().toISOString(),
        workDone: logForm.workDone.trim(),
        hoursWorked: Number(logForm.hoursWorked || 0),
        technologiesUsed: logForm.technologiesUsed.trim() || undefined,
        challenges: logForm.challenges.trim() || undefined,
        tomorrowPlan: logForm.tomorrowPlan.trim() || undefined,
      };
      if (logEditor?.id) {
        await api.put(`/reports/daily-logs/${logEditor.id}`, payload);
      } else {
        await api.post('/reports/daily-logs', payload);
      }
      notify.success('Daily log saved.');
      clearLogEditor();
      load();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to save log.');
    } finally {
      setSavingLog(false);
    }
  };

  const generateWeekly = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/reports/generate-weekly');
      setCurrentWeek((prev) => ({ ...prev, report: data.report, preview: data.report }));
      setReportForm({
        title: data.report.title || '',
        content: data.report.content || '',
      });
      notify.success('Weekly report generated.');
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to generate weekly report.');
    } finally {
      setGenerating(false);
    }
  };

  const saveReport = async () => {
    if (!currentReport) return;
    if (!reportForm.title.trim() || !reportForm.content.trim()) {
      notify.error('Weekly report cannot be empty.');
      return;
    }
    setSavingReport(true);
    try {
      const { data } = await api.patch(`/reports/${currentReport.id}`, {
        title: reportForm.title.trim(),
        content: reportForm.content,
      });
      setCurrentWeek((prev) => ({ ...prev, report: data.report, preview: data.report }));
      notify.success('Draft saved.');
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to save draft.');
    } finally {
      setSavingReport(false);
    }
  };

  const submitReport = async () => {
    if (!currentReport) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/reports/${currentReport.id}/submit`);
      setCurrentWeek((prev) => ({ ...prev, report: data.report, preview: data.report }));
      notify.success('Weekly report submitted.');
      load();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistory = async (report) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryTitle(report.title);
    try {
      const { data } = await api.get(`/reports/${report.id}/history`);
      setHistoryItems(data.items || []);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to load feedback history.');
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const feedbackCards = useMemo(() => {
    return reports.filter((report) => report.latestReview || report.feedback || report.status !== 'DRAFT');
  }, [reports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Reports"
        subtitle="Capture daily work, generate a weekly summary and track mentor feedback."
        action={
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition"
            style={{ color: 'var(--text)' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      {needsReminder && (
        <div className="flex items-start gap-3 rounded-2xl border px-4 py-3" style={{ background: 'rgba(255,109,52,0.08)', borderColor: 'rgba(255,109,52,0.2)' }}>
          <AlertCircle size={18} style={{ color: '#ff6d34', marginTop: 2 }} />
          <div>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>Don't forget to update today's work.</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Your daily log keeps the weekly report accurate and easy to review.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Weekly Reports Submitted</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-black" style={{ color: 'var(--text)' }}>{stats?.weeklyReportsSubmitted ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>All submitted, reviewed and revision cycles.</p>
            </div>
            <FileText size={24} style={{ color: '#ff6d34' }} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Pending Review</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-black" style={{ color: 'var(--text)' }}>{stats?.pendingReview ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Reports waiting on mentor feedback.</p>
            </div>
            <History size={24} style={{ color: '#7c3aed' }} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Average Rating</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-black" style={{ color: 'var(--text)' }}>{formatRating(stats?.averageRating)}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{ratingToStars(stats?.averageRating || 0)}</p>
            </div>
            <Star size={24} style={{ color: '#f59e0b' }} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Last Feedback Date</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{stats?.lastFeedbackDate ? formatDate(stats.lastFeedbackDate) : 'No feedback yet'}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Latest mentor response across your reports.</p>
            </div>
            <CalendarDays size={24} style={{ color: '#00bea3' }} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Daily Work Log</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Log your work for today. Older entries stay read-only unless a mentor reopens them.</p>
            </div>
            <Badge variant={todayLog ? 'success' : 'warning'}>
              {todayLog ? 'Today updated' : 'Today missing'}
            </Badge>
          </div>

          {logEditor && (
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{formatDate(logEditor.date)}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{logEditor.status === 'REOPENED' ? 'Reopened by mentor' : 'Editable log'}</p>
                </div>
                <button onClick={clearLogEditor} className="text-xs font-medium" style={{ color: '#ff6d34' }}>Cancel edit</button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <Input
              label="Today's Work"
              placeholder="Created login API, fixed JWT issue, reviewed docs..."
              value={logForm.workDone}
              onChange={(e) => setLogForm({ ...logForm, workDone: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Hours Worked"
                type="number"
                min={0}
                max={24}
                step="0.5"
                icon={Clock3}
                value={logForm.hoursWorked}
                onChange={(e) => setLogForm({ ...logForm, hoursWorked: e.target.value })}
              />
              <Input
                label="Technologies Used"
                placeholder="React, Express, Prisma"
                value={logForm.technologiesUsed}
                onChange={(e) => setLogForm({ ...logForm, technologiesUsed: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Challenges Faced</label>
              <textarea
                rows={3}
                value={logForm.challenges}
                onChange={(e) => setLogForm({ ...logForm, challenges: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition font-sans"
                placeholder="Authentication bug, missing seed data, flaky test..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Tomorrow's Plan</label>
              <textarea
                rows={3}
                value={logForm.tomorrowPlan}
                onChange={(e) => setLogForm({ ...logForm, tomorrowPlan: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition font-sans"
                placeholder="Continue dashboard integration, write tests..."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <GreenButton onClick={saveLog} icon={PencilLine}>{savingLog ? 'Saving...' : logEditor ? 'Update Log' : 'Save Log'}</GreenButton>
              <button
                onClick={() => setLogForm(emptyLogForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition"
                style={{ color: 'var(--text)' }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Recent Daily Logs</h4>
            <div className="space-y-3">
              {dailyLogs.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>No daily logs yet.</p>
              ) : dailyLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>{formatDate(log.date)}</p>
                        <Badge variant={log.canEdit ? 'success' : 'gray'}>{log.canEdit ? 'Editable' : 'Read only'}</Badge>
                        {log.report?.status && <Badge variant={reportBadgeVariant(log.report.status)}>{getReportStatusLabel(log.report.status)}</Badge>}
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{log.workDone}</p>
                      <div className="mt-2 text-xs space-y-1" style={{ color: 'var(--muted)' }}>
                        <p><strong>Hours:</strong> {log.hoursWorked}</p>
                        <p><strong>Tech:</strong> {log.technologiesUsed || 'None'}</p>
                        <p><strong>Challenges:</strong> {log.challenges || 'None'}</p>
                        <p><strong>Tomorrow:</strong> {log.tomorrowPlan || 'None'}</p>
                      </div>
                    </div>
                    {log.canEdit && (
                      <button
                        onClick={() => openLogEditor(log)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        style={{ color: 'var(--text)' }}
                      >
                        <PencilLine size={14} /> Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Weekly Report Preview</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Generate from your daily logs, refine the draft and submit it for mentor review.</p>
              </div>
              <Badge variant={currentReport ? reportBadgeVariant(currentReport.status) : 'gray'}>
                {currentReport ? getReportStatusLabel(currentReport.status) : 'Draft preview'}
              </Badge>
            </div>

            {currentReport ? (
              <>
                <Input
                  label="Report Title"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  disabled={!editableReport}
                />
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Weekly Report</label>
                  <textarea
                    rows={18}
                    value={reportForm.content}
                    onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
                    disabled={!editableReport}
                    className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition font-sans whitespace-pre-wrap"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Total Hours</p>
                    <p className="text-2xl font-black mt-1" style={{ color: 'var(--text)' }}>{weeklySummary.totalHours ?? 0}</p>
                  </div>
                  <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Technologies</p>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text)' }}>{weeklySummary.technologies?.join(', ') || 'Not added yet'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <GreenButton onClick={saveReport} icon={Sparkles} className={!editableReport ? 'opacity-50 pointer-events-none' : ''}>{savingReport ? 'Saving...' : 'Save Draft'}</GreenButton>
                  <button
                    onClick={submitReport}
                    disabled={!editableReport}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${editableReport ? '' : 'opacity-50 cursor-not-allowed'}`}
                    style={{ background: '#ff6d34' }}
                  >
                    <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Feedback History</p>
                  <div className="space-y-3 max-h-72 overflow-auto pr-1">
                    {(currentReport.feedbackHistory || []).length === 0 ? (
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>No feedback yet.</p>
                    ) : currentReport.feedbackHistory.map((item) => (
                      <div key={item.id} className="rounded-2xl border p-3" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{ratingToStars(item.rating || 0)} {formatRating(item.rating || 0)}</p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.reviewedBy?.name || 'Mentor'} ? {formatRelative(item.createdAt)}</p>
                          </div>
                          <Badge variant={reportBadgeVariant(item.status)}>{getReportStatusLabel(item.status)}</Badge>
                        </div>
                        {item.feedback && <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{item.feedback}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-3xl border p-4" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{currentPreview?.title || 'No weekly draft yet'}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{currentPreview ? 'Generated from your daily logs.' : 'Add daily logs to generate a report.'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Generated Preview</label>
                  <textarea
                    readOnly
                    rows={16}
                    value={currentPreview?.content || ''}
                    className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none font-sans whitespace-pre-wrap opacity-90"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <GreenButton onClick={generateWeekly} icon={Sparkles}>{generating ? 'Generating...' : 'Generate Weekly Report'}</GreenButton>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Total Hours</p>
                    <p className="text-2xl font-black mt-1" style={{ color: 'var(--text)' }}>{weeklySummary.totalHours ?? 0}</p>
                  </div>
                  <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Challenges</p>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text)' }}>{weeklySummary.challenges?.length || 0} logged</p>
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Feedback History</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>A quick view of your most recent mentor responses.</p>
              </div>
              <History size={18} style={{ color: '#7c3aed' }} />
            </div>
            <div className="space-y-3 max-h-[32rem] overflow-auto pr-1">
              {feedbackCards.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>No feedback history yet.</p>
              ) : feedbackCards.map((report) => (
                <button
                  key={report.id}
                  onClick={() => openHistory(report)}
                  className="w-full text-left rounded-2xl border p-4 transition hover:border-orange-300"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold break-words" style={{ color: 'var(--text)' }}>{report.title}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Submitted {formatRelative(report.submittedAt)} ? {report.latestReview ? ratingToStars(report.latestReview.rating || 0) : 'No rating yet'}</p>
                    </div>
                    <Badge variant={reportBadgeVariant(report.status)}>{getReportStatusLabel(report.status)}</Badge>
                  </div>
                  {report.latestReview?.feedback && <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{report.latestReview.feedback}</p>}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={historyTitle || 'Feedback History'}
        footer={<button onClick={() => setHistoryOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Close</button>}
      >
        {historyLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin" size={24} /></div>
        ) : (
          <div className="space-y-3">
            {historyItems.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No feedback entries yet.</p>
            ) : historyItems.map((item) => (
              <div key={item.id} className="rounded-2xl border p-4" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>{ratingToStars(item.rating || 0)} {formatRating(item.rating || 0)}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.reviewedBy?.name || 'Mentor'} ? {formatRelative(item.createdAt)}</p>
                  </div>
                  <Badge variant={reportBadgeVariant(item.status)}>{getReportStatusLabel(item.status)}</Badge>
                </div>
                {item.feedback && <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>{item.feedback}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
