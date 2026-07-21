 sneha-new-ui
// ════════════════════════════════════════════════════════════
// Mentor — Reports review
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useMemo } from 'react';
import { FileText, Loader2, CheckCircle, Clock, ChevronRight, X, Search } from 'lucide-react';
import { Card, Modal } from '../../shared/components/UI';

// Mentor - Reports review
import { useCallback, useEffect, useState } from 'react';
import { Eye, FileText, Loader2, RefreshCw } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal, GreenButton } from '../../shared/components/UI';
// Mentor — Reports review
import { useEffect, useState, useCallback } from 'react';
import { FileText, Loader2, CheckCircle, X } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal } from '../../shared/components/UI';
 main
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate, formatRelative } from '../../lib/utils';
import { getReportStatusLabel, reportBadgeVariant, ratingToStars, formatRating } from '../../shared/config/reports';

const FILTERS = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'REJECTED', 'ALL'];

const ratingButtons = [1, 2, 3, 4, 5];

// --- REALISTIC MOCK DATA (For Presentation) ---
const mockReports = [
  { id: '1', title: 'Frontend Dashboard Setup & Routing', user: { name: 'Aarav Sharma' }, weekNumber: 2, submittedAt: new Date(Date.now() - 14400000).toISOString(), status: 'PENDING', content: 'Completed the main layout and routing using React Router. Added basic layout components and integrated the Soft Navy and Cyan color palette.' },
  { id: '2', title: 'API Integration for Analytics', user: { name: 'Priya Patel' }, weekNumber: 2, submittedAt: new Date(Date.now() - 86400000).toISOString(), status: 'PENDING', content: 'Integrated Recharts and connected it to the mock API endpoints to show weekly activity flow.' },
  { id: '3', title: 'Database Schema Optimization', user: { name: 'Rohan Singh' }, weekNumber: 1, submittedAt: new Date(Date.now() - 172800000).toISOString(), status: 'REVIEWED', score: 6.5, content: 'Updated the user tables but facing some issues with foreign key constraints.', feedback: 'Please review the indexing strategy again. Let us connect on a call.' },
  { id: '4', title: 'Machine Learning Unit 1 Notes', user: { name: 'Neha Gupta' }, weekNumber: 2, submittedAt: new Date(Date.now() - 259200000).toISOString(), status: 'REVIEWED', score: 9.5, content: 'Compiled study notes for Decision Tree learning and visualization tools. Prepared presentation for practicals.', feedback: 'Excellent detail! The visualization parts are perfectly documented.' },
];

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('SUBMITTED');
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rating, setRating] = useState('');
  const [feedback, setFeedback] = useState('');
sneha-new-ui
  const [searchQuery, setSearchQuery] = useState(''); // NEW: Search state

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports', { params: { limit: 50, status: filter === 'ALL' ? undefined : filter } });
      setReports(data?.items?.length > 0 ? data.items : getFilteredMockData(filter));
    } catch (err) {
      setReports(getFilteredMockData(filter));
    } finally { 
      setLoading(false); 
    }
  };

  const getFilteredMockData = (currentFilter) => {
    if (currentFilter === 'ALL') return mockReports;
    return mockReports.filter(r => r.status === currentFilter);
  };

  useEffect(() => { 
    fetchReports(); 
  }, [filter]);

  // NEW: Search Filter Logic
  const filteredReports = useMemo(() => {
    return reports.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reports, searchQuery]);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports', { params: { limit: 50, status: filter === 'ALL' ? undefined : filter } });
      setReports(data.items || []);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const openReview = async (report) => {
    setReviewOpen(report);
    setDetail(report);
    setDetailLoading(true);
    setRating(report.latestReview?.rating ? String(report.latestReview.rating) : report.score ? String(Math.round(report.score / 2)) : '');
    setFeedback(report.latestReview?.feedback || report.feedback || '');
    setStatus(['UNDER_REVIEW', 'REVIEWED', 'NEEDS_REVISION', 'APPROVED', 'REJECTED'].includes(report.status) ? report.status : '');
    try {
      const { data } = await api.get(`/reports/${report.id}`);
      setDetail(data.report);
      setRating(data.report.latestReview?.rating ? String(data.report.latestReview.rating) : data.report.score ? String(Math.round(data.report.score / 2)) : '');
      setFeedback(data.report.latestReview?.feedback || data.report.feedback || '');
      setStatus(['UNDER_REVIEW', 'REVIEWED', 'NEEDS_REVISION', 'APPROVED', 'REJECTED'].includes(data.report.status) ? data.report.status : '');
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to load report details.');
    } finally {
      setDetailLoading(false);
    }
  };
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports', { params: { limit: 50, status: filter === 'ALL' ? undefined : filter } });
      setReports(data.items);
    } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { fetch(); }, [fetch]);
main

  const submitReview = async () => {
    if (!reviewOpen) return;
    if (!status) {
      notify.error('Please select a decision.');
      return;
    }
    if (!feedback.trim()) {
      notify.error('Feedback is required.');
      return;
    }
    setSubmitting(true);
    try {
 sneha-new-ui
      await api.patch(`/reports/${reviewOpen.id}/review`, {
        status: 'REVIEWED',
        score: score ? Number(score) : undefined,
        feedback: feedback || undefined,
      }).catch(() => console.log("Mock API successful for presentation."));
      
      notify.success('Report reviewed successfully.');
      setReviewOpen(null);
      setScore(''); 
      setFeedback('');
      fetchReports();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to submit review.');
      const { data } = await api.patch(`/reports/${reviewOpen.id}/review`, {
        status,
        rating: rating ? Number(rating) : undefined,
        feedback: feedback.trim(),
      });
      notify.success('Report reviewed.');
      setReports((prev) => prev.map((report) => (report.id === data.report.id ? data.report : report)));
      setReviewOpen(null);
      setDetail(null);
      setRating('');
      setFeedback('');
      setStatus('');
      fetchReports();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to save review.');
    } finally {
      setSubmitting(false);
      main
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-[#4FD1C5]" size={36} />
    </div>
  );

  return (
 sneha-new-ui
    <div className="space-y-6 bg-[#F7FAFC] min-h-screen pb-10 relative">
      
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col mb-4">
        <h2 className="text-3xl font-black text-[#1F3A5F] mb-1">Reports to Review</h2>
        <p className="text-sm text-[#A0AEC0] font-medium">Evaluate intern submissions and provide constructive feedback.</p>
      </div>

      {/* --- PRO NAVIGATION TABS & LOCAL SEARCH --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#A0AEC0]/20 pb-5">
        
        {/* Tabs */}
        <div className="flex items-center gap-3">
          {['PENDING', 'REVIEWED', 'ALL'].map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                filter === f 
                  ? 'bg-[#1F3A5F] text-[#F7FAFC] shadow-lg transform -translate-y-0.5' 
                  : 'bg-white text-[#A0AEC0] border border-[#A0AEC0]/30 hover:border-[#1F3A5F]/40 hover:text-[#1F3A5F]'
              }`}
            >
              {f} 
              {f === 'PENDING' && filter !== f && reports.filter(r=>r.status==='PENDING').length > 0 && (
                <span className="ml-2 bg-[#4FD1C5] text-[#1F3A5F] px-2 py-0.5 rounded-md text-[10px] font-black">NEW</span>
              )}
            </button>
          ))}
        </div>

        {/* Local Search Bar */}
        <div className="relative group w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#4FD1C5] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by title or intern name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#A0AEC0]/40 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-[#1F3A5F] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] focus:border-[#4FD1C5] transition-all shadow-sm placeholder:text-[#A0AEC0]"
          />
        </div>

      </div>

      {/* --- REPORTS LIST --- */}
      <div className="space-y-4">
        {filteredReports.map((r) => (
          <Card 
            key={r.id} 
            className="p-0 cursor-pointer border border-[#A0AEC0]/30 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden relative" 
            onClick={() => { setReviewOpen(r); setScore(r.score ?? ''); setFeedback(r.feedback ?? ''); }}
          >
            {/* Left Accent Border for dynamic feel */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${r.status === 'PENDING' ? 'bg-[#4FD1C5] opacity-0 group-hover:opacity-100' : 'bg-[#A0AEC0]/30'}`}></div>

            <div className="p-5 pl-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-start gap-5 flex-1 min-w-0">
                <div className={`p-3.5 rounded-2xl flex-shrink-0 transition-colors ${
                  r.status === 'REVIEWED' ? 'bg-[#4FD1C5]/10 text-[#0d9488]' : 'bg-[#1F3A5F]/5 text-[#1F3A5F]'
                }`}>
                  <FileText size={24} />
                </div>
                
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="text-lg font-bold text-[#1F3A5F] group-hover:text-[#4FD1C5] transition-colors break-words mb-1.5">
                    {r.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-2 text-xs font-bold text-[#A0AEC0]">
                    <span className="text-[#1F3A5F] bg-[#1F3A5F]/5 px-2 py-0.5 rounded-md">{r.user?.name}</span>
                    <span className="w-1 h-1 rounded-full bg-[#A0AEC0]/50"></span>
                    <span>Week {r.weekNumber ?? '—'}</span>
                    <span className="w-1 h-1 rounded-full bg-[#A0AEC0]/50"></span>
                    <span className="flex items-center gap-1"><Clock size={12}/> {formatRelative(r.submittedAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${
                  r.status === 'REVIEWED' 
                    ? 'bg-[#4FD1C5]/20 text-[#0d9488] border border-[#4FD1C5]/30' 
                    : 'bg-[#1F3A5F]/5 text-[#1F3A5F] border border-[#1F3A5F]/10'
                }`}>
                  {r.status}
                </span>
                
                {r.score != null ? (
                  <span className="text-base font-black text-[#1F3A5F]">
                    {r.score} <span className="text-[#A0AEC0] text-xs font-bold">/ 10</span>
                  </span>
                ) : (
                  <span className="text-[#4FD1C5] text-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#4FD1C5]/10 px-3 py-1 rounded-lg">
                    Review Now <ChevronRight size={14} strokeWidth={3} />
                  </span>
                )}

    <div className="space-y-6">
      <SectionHeader title="Reports to Review" subtitle="Review daily-driven weekly reports, add feedback and set the final decision." action={<button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" style={{ color: 'var(--text)' }}><RefreshCw size={15} /> Refresh</button>} />

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-3 rounded-xl flex-shrink-0" style={{ background: r.status === 'APPROVED' ? 'rgba(0,190,163,0.15)' : r.status === 'NEEDS_REVISION' ? 'rgba(220,38,38,0.15)' : 'rgba(124,58,237,0.15)' }}>
                  <FileText size={20} style={{ color: r.status === 'APPROVED' ? '#00bea3' : r.status === 'NEEDS_REVISION' ? '#dc2626' : '#7C3AED' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white break-words">{r.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{r.user?.name} ? Week {r.weekNumber ?? '?'} ? {formatRelative(r.submittedAt)}</p>
                  {r.latestReview?.feedback && <p className="text-xs mt-1 italic" style={{ color: 'var(--muted)' }}>?{r.latestReview.feedback}?</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={reportBadgeVariant(r.status)}>{getReportStatusLabel(r.status)}</Badge>
                {r.latestReview?.rating != null && <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">{ratingToStars(r.latestReview.rating)} {formatRating(r.latestReview.rating)}</span>}
                <button onClick={() => openReview(r)} className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-medium" style={{ background: '#ff6d34' }}>
                  <Eye size={12} /> Review
                </button>
main
              </div>
            </div>
          </Card>
        ))}
 sneha-new-ui

        {filteredReports.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-24 px-6 text-center shadow-sm border border-[#A0AEC0]/30 bg-white rounded-2xl">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-[#F7FAFC] border border-[#A0AEC0]/30">
              <Search size={36} className="text-[#A0AEC0]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#1F3A5F]">No reports found</h3>
            <p className="max-w-md text-sm text-[#A0AEC0] font-medium">Try adjusting your search or switching the filter tab.</p>
          </Card>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          GLASSMORPHISM REVIEW MODAL (Unchanged)
          ════════════════════════════════════════════════════════════ */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F3A5F]/60 backdrop-blur-md animate-in fade-in duration-200">
          
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 border border-[#A0AEC0]/20">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#F7FAFC] flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-lg font-black text-[#1F3A5F] flex items-center gap-2">
                <FileText size={20} className="text-[#4FD1C5]"/> Review Intern Report
              </h2>
              <button 
                onClick={() => setReviewOpen(null)}
                className="p-2 bg-[#F7FAFC] hover:bg-rose-100 hover:text-rose-600 text-[#A0AEC0] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Context Info */}
              <div className="bg-[#F7FAFC] p-5 rounded-2xl border border-[#A0AEC0]/20 flex flex-col gap-1">
                <p className="text-xl font-black text-[#1F3A5F] leading-tight">{reviewOpen.title}</p>
                <div className="flex items-center gap-2 text-sm font-medium text-[#A0AEC0] mt-2">
                  <span className="bg-white px-2.5 py-1 rounded-md shadow-sm border border-[#A0AEC0]/10 text-[#1F3A5F] font-bold">
                    {reviewOpen.user?.name}
                  </span>
                  <span>•</span>
                  <span>{formatDate(reviewOpen.submittedAt)}</span>
                </div>
              </div>
              
              {/* Report Content */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest block mb-2 text-[#A0AEC0]">Report Content</label>
                <pre className="text-sm whitespace-pre-wrap p-5 rounded-2xl border border-[#A0AEC0]/20 bg-[#F7FAFC]/50 text-[#1F3A5F] font-medium leading-relaxed" 
                     style={{ fontFamily: 'inherit' }}>
                  {reviewOpen.content || 'No content provided by the intern.'}
                </pre>
              </div>

              {/* Grading Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-white p-4 rounded-2xl border border-[#A0AEC0]/30 shadow-sm focus-within:border-[#4FD1C5] focus-within:ring-2 focus-within:ring-[#4FD1C5]/20 transition-all">
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1 text-[#A0AEC0]">Score (0–10)</label>
                  <input 
                    type="number" min="0" max="10" step="0.1" 
                    value={score} 
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. 8.5"
                    className="w-full bg-transparent text-2xl font-black text-[#1F3A5F] focus:outline-none placeholder:text-[#A0AEC0]/40" 
                  />
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#A0AEC0]/30 shadow-sm flex flex-col justify-center">
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-2 text-[#A0AEC0]">Action Status</label>
                  <div className="w-full px-4 py-2 rounded-xl bg-[#4FD1C5]/10 text-[#0d9488] border border-[#4FD1C5]/30 font-black text-sm flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Mark as Reviewed
                  </div>
                </div>
              </div>
              
              {/* Feedback Section */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest block mb-2 text-[#A0AEC0]">Mentor Feedback</label>
                <textarea 
                  value={feedback} 
                  onChange={(e) => setFeedback(e.target.value)} 
                  rows={4}
                  placeholder="Write your feedback here... (This will be visible to the intern)"
                  className="w-full p-4 rounded-2xl border border-[#A0AEC0]/30 bg-white text-[#1F3A5F] font-medium focus:outline-none focus:ring-4 focus:ring-[#4FD1C5]/20 focus:border-[#4FD1C5] transition-all resize-none placeholder:text-[#A0AEC0]/60 shadow-sm" 
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#F7FAFC] bg-white flex items-center justify-end gap-3 rounded-b-[2rem]">
              <button 
                onClick={() => setReviewOpen(null)} 
                className="px-6 py-2.5 text-sm font-bold text-[#A0AEC0] hover:text-[#1F3A5F] hover:bg-[#F7FAFC] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitReview} 
                className="flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-black text-[#1F3A5F] bg-[#4FD1C5] hover:bg-[#1F3A5F] hover:text-[#4FD1C5] rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <CheckCircle size={16} strokeWidth={3} /> Save Review
              </button>
            </div>


        {reports.length === 0 && <div className="text-center py-16 text-slate-400"><FileText size={40} className="mx-auto mb-3 opacity-30" /><p>No reports in this view.</p></div>}
      </div>

      <Modal isOpen={!!reviewOpen} onClose={() => setReviewOpen(null)} title="Review report"
        footer={
          <>
            <button
            onClick={() => setReviewOpen(null)}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >Cancel
            </button>
            <GreenButton
              onClick={submitReview}
              disabled={!status || !feedback.trim() || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </GreenButton>
          </>
        }>
        {reviewOpen && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{reviewOpen.title}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{reviewOpen.user?.name} ? {formatDate(reviewOpen.submittedAt)}</p>
            </div>
            {detailLoading ? <div className="py-8 flex justify-center"><Loader2 className="animate-spin" size={24} /></div> : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Weekly Status</p>
                    <Badge variant={reportBadgeVariant(detail?.status || reviewOpen.status)}>{getReportStatusLabel(detail?.status || reviewOpen.status)}</Badge>
                    <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Week {detail?.weekNumber ?? reviewOpen.weekNumber ?? '?'}</p>
                  </div>
                  <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Rating</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {ratingButtons.map((item) => (
                        <button key={item} type="button" onClick={() => setRating(String(item))} className={`px-3 py-2 rounded-xl border text-sm font-semibold transition ${String(item) === rating ? 'text-white' : ''}`} style={{ background: String(item) === rating ? '#ff6d34' : 'var(--card)', borderColor: 'var(--border)' }}>{'\u2B50'.repeat(item)}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>Decision</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['APPROVED', 'Approve'],
                      ['NEEDS_REVISION', 'Needs Revision'],
                      ['REJECTED', 'Reject'],
                      ['UNDER_REVIEW', 'Under Review'],
                      ['REVIEWED', 'Reviewed'],
                    ].map(([value, label]) => (
                      <button key={value} type="button" onClick={() => setStatus(value)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${status === value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} style={{ background: status === value ? '#7c3aed' : 'var(--card)', borderColor: 'var(--border)' }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>Weekly Report</label>
                  <pre className="text-xs whitespace-pre-wrap p-4 rounded-2xl border max-h-64 overflow-auto" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }}>{detail?.content || reviewOpen.content || '(no content)'}</pre>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted)' }}>Feedback</label>
                  <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none" />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Daily Logs</p>
                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {(detail?.dailyLogs || []).map((log) => (
                      <div key={log.id} className="rounded-2xl border p-3" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{formatDate(log.date)} ? {log.hoursWorked}h</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{log.workDone}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Tech: {log.technologiesUsed || 'None'}</p>
                      </div>
                    ))}
                    {(detail?.dailyLogs || []).length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No daily logs were attached.</p>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Feedback History</p>
                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {(detail?.feedbackHistory || []).map((item) => (
                      <div key={item.id} className="rounded-2xl border p-3" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{ratingToStars(item.rating || 0)} {formatRating(item.rating || 0)}</p>
                          <Badge variant={reportBadgeVariant(item.status)}>{getReportStatusLabel(item.status)}</Badge>
                        </div>
                                {item.feedback && <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{item.feedback}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
 main
          </div>
        </div>
      )}

    </div>
  );
};

 sneha-new-ui
export default Reports;

export default Reports;




 main
