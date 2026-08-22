import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import notify from '../../lib/toast';
import { Card } from '../../shared/components/UI';
import { Code, History, Play, AlertTriangle, ShieldAlert, Info, Sparkles, Loader2, Trash2 } from 'lucide-react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'html_css', label: 'HTML/CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'go', label: 'Go' },
];

const FOCUS_AREAS = [
  { value: 'correctness', label: 'Correctness' },
  { value: 'security', label: 'Security' },
  { value: 'performance', label: 'Performance' },
  { value: 'formatting', label: 'Formatting / style' },
];

const TYPE_COLORS = {
  error: { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', text: '#f87171', icon: ShieldAlert },
  warning: { bg: 'rgba(251,191,36,0.1)', border: '#f59e0b', text: '#fbbf24', icon: AlertTriangle },
  info: { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', text: '#60a5fa', icon: Info },
};

const CodeReview = () => {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [focus, setFocus] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/ai-review');
      setReviews(data.items || []);
      if (data.items?.length > 0 && !selectedReview) {
        setSelectedReview(data.items[0]);
      }
    } catch (err) {
      notify.error('Failed to load code review history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleFocus = (val) => {
    setFocus((prev) =>
      prev.includes(val) ? prev.filter((f) => f !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return notify.error('Please enter a title for the review.');
    if (!code.trim()) return notify.error('Please paste your code snippet.');

    setLoading(true);
    try {
      const { data } = await api.post('/ai-review', {
        title: title.trim(),
        language,
        code,
        focus,
      });
      notify.success('AI Code Review completed successfully!');
      setReviews((prev) => [data, ...prev]);
      setSelectedReview(data);
      // Clear form
      setTitle('');
      setCode('');
      setFocus([]);
    } catch (err) {
      notify.error(getErrorMessage(err) || 'Code review request failed.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#10b981'; // Green
    if (score >= 6) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar: Submission Form & History List */}
      <div className="lg:col-span-1 space-y-6">
        {/* Submit Review Card */}
        <Card className="p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: 'var(--text)' }}>
            <Sparkles size={16} className="text-orange-500" />
            Request AI Review
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--muted)' }}>Review Title</label>
              <input
                type="text"
                placeholder="e.g. Auth middleware"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 rounded-lg text-xs"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--muted)' }}>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 rounded-lg text-xs"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--muted)' }}>Focus Areas</label>
              <div className="grid grid-cols-2 gap-2">
                {FOCUS_AREAS.map((f) => {
                  const active = focus.includes(f.value);
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => handleToggleFocus(f.value)}
                      className="p-1.5 rounded-md text-[10px] font-semibold border text-center transition"
                      style={{
                        background: active ? 'rgba(255,109,52,0.1)' : 'transparent',
                        borderColor: active ? '#ff6d34' : 'var(--border)',
                        color: active ? '#ff6d34' : 'var(--text-soft)',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--muted)' }}>Code Snippet</label>
              <textarea
                placeholder="Paste your code snippet here..."
                rows={8}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2 rounded-lg text-xs font-mono"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', resize: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background: '#ff6d34', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Reviewing code...
                </>
              ) : (
                <>
                  <Play size={12} fill="white" /> Request Review
                </>
              )}
            </button>
          </form>
        </Card>

        {/* History List Card */}
        <Card className="p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: 'var(--text)' }}>
            <History size={16} style={{ color: 'var(--text-soft)' }} />
            Review History
          </h3>
          {historyLoading ? (
            <div className="py-4 text-center"><Loader2 size={18} className="animate-spin inline" style={{ color: 'var(--muted)' }} /></div>
          ) : reviews.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: 'var(--muted)' }}>No previous reviews.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {reviews.map((r) => {
                const isSelected = selectedReview?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReview(r)}
                    className="w-full text-left p-2.5 rounded-lg border flex items-center justify-between gap-2 transition"
                    style={{
                      background: isSelected ? 'var(--bg-soft)' : 'transparent',
                      borderColor: isSelected ? '#ff6d34' : 'var(--border)',
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{r.title}</p>
                      <p className="text-[9px]" style={{ color: 'var(--muted)' }}>
                        {r.language.toUpperCase()} • {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span 
                      className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white" 
                      style={{ background: getScoreColor(r.score) }}
                    >
                      {r.score}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Right Side: Code Viewer & AI Comments */}
      <div className="lg:col-span-3 space-y-6">
        {selectedReview ? (
          <div className="space-y-6">
            {/* Overview Card */}
            <Card className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div 
                className="w-16 h-16 rounded-full flex flex-col items-center justify-center text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${getScoreColor(selectedReview.score)}, #374151)` }}
              >
                <span className="text-xl font-black">{selectedReview.score}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">Score</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>{selectedReview.title}</h2>
                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  Language: <span className="font-bold text-orange-500 uppercase">{selectedReview.language}</span> • Reviewed on {new Date(selectedReview.createdAt).toLocaleString()}
                </p>
                <div className="text-xs mt-3 whitespace-pre-line p-3 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-soft)' }}>
                  <strong>Summary Feedback:</strong><br />
                  {selectedReview.summary}
                </div>
              </div>
            </Card>

            {/* Interactive Code Viewer Card */}
            <Card className="p-0 overflow-hidden" style={{ background: '#1e1e1e', borderColor: 'var(--border)' }}>
              <div className="px-4 py-2 border-b flex justify-between items-center" style={{ borderColor: '#2d2d2d', background: '#121212' }}>
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                  <Code size={13} />
                  Code Explorer & Inline AI Feedback
                </span>
                <span className="text-[10px] font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                  {selectedReview.comments?.length || 0} issues found
                </span>
              </div>

              <div className="overflow-x-auto text-xs font-mono select-text" style={{ padding: '12px 0' }}>
                {selectedReview.code.split('\n').map((lineText, idx) => {
                  const lineNum = idx + 1;
                  // Find all comments for this line number
                  const lineComments = selectedReview.comments?.filter((c) => Number(c.line) === lineNum) || [];

                  return (
                    <div key={lineNum} className="flex flex-col">
                      {/* Code line row */}
                      <div className="flex hover:bg-white/5 transition px-2 py-0.5">
                        <span className="w-10 text-right pr-4 text-gray-600 select-none border-r border-gray-800">{lineNum}</span>
                        <pre className="pl-4 text-gray-300 overflow-visible whitespace-pre-wrap word-break" style={{ margin: 0 }}>
                          {lineText || ' '}
                        </pre>
                      </div>

                      {/* Render comments underneath this line if any */}
                      {lineComments.map((comment, cIdx) => {
                        const style = TYPE_COLORS[comment.type] || TYPE_COLORS.info;
                        const CommentIcon = style.icon;

                        return (
                          <div 
                            key={cIdx} 
                            className="ml-14 my-1 mr-4 rounded-lg border p-3 flex gap-2.5 items-start shadow-md transition"
                            style={{ background: style.bg, borderColor: style.border }}
                          >
                            <CommentIcon size={14} className="flex-shrink-0 mt-0.5" style={{ color: style.border }} />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[10px] uppercase tracking-wider mb-0.5" style={{ color: style.border }}>
                                AI Code Review ({comment.type})
                              </p>
                              <p className="text-xs leading-relaxed" style={{ color: '#e2e8f0' }}>{comment.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : (
          <div className="py-24 text-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
            <Code size={40} className="mx-auto mb-3 text-orange-500/50" />
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>No code review selected</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Request a new AI review on the left or select an item from the history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeReview;
