// ════════════════════════════════════════════════════════════
//  USER — pages/QA.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { ThumbsUp, MessageCircle, Search, Plus, MessageSquare, Loader2, Send } from 'lucide-react';
import { Card, Badge } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatRelative } from '../../lib/utils';
import { getSocket } from '../../lib/socket';
import { APP_CONSTANTS } from '../../shared/config/constants';

const QA = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);
  const [openData, setOpenData] = useState(null);
  const [newAnswer, setNewAnswer] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/qa/questions', { params: { limit: 50 } });
      setQuestions(data.items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    if (!openId) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;
    const onAnswer = (data) => {
      if (data.questionId === openId) {
        setOpenData((prev) => prev ? { ...prev, answers: [...prev.answers, data.answer] } : prev);
      }
    };
    socket.on('qa:answer', onAnswer);
    return () => {
      socket.off('qa:answer', onAnswer);
      socket.emit('leave:qa', openId);
    };
  }, [openId]);

  const add = async () => {
    if (!newQuestion.trim()) return;
    try {
      const { data } = await api.post('/qa/questions', {
        title: newQuestion.trim(),
        body: newQuestion.trim(),
        category: category === 'All' ? undefined : category,
      });
      setQuestions((qs) => [{ ...data.question, _count: { answers: 0, upvotes: 0 }, author: { name: 'You', role: 'INTERN' } }, ...qs]);
      setNewQuestion('');
      notify.success('Question posted!');
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to post.');
    }
  };

  const upvote = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post('/qa/upvote', { type: 'question', id });
      setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, _count: { ...q._count, upvotes: (q._count?.upvotes ?? 0) + 1 } } : q));
    } catch {
      /* ignore */
    }
  };

  const open = async (id) => {
    setOpenId(id);
    try {
      const { data } = await api.get(`/qa/questions/${id}`);
      setOpenData(data.question);
      const socket = getSocket();
      if (socket) {
        socket.emit('join:qa', id);
      }
    } catch {
      notify.error('Failed to load question.');
    }
  };

  const postAnswer = async () => {
    if (!newAnswer.trim() || !openData) return;
    try {
      const { data } = await api.post(`/qa/questions/${openData.id}/answers`, { body: newAnswer.trim() });
      setOpenData({ ...openData, answers: [...openData.answers, data.answer] });
      setNewAnswer('');
      notify.success('Answer posted!');
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to post answer.');
    }
  };

  const filtered = questions.filter((q) =>
    (category === 'All' || q.category === category) &&
    (!search || q.title.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  if (openId && openData) {
    return (
      <div className="space-y-6">
        <button onClick={() => { setOpenId(null); setOpenData(null); setNewAnswer(''); }} className="text-sm text-blue-600 hover:underline">
          ← Back to questions
        </button>
        <Card className="p-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{openData.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 whitespace-pre-wrap">{openData.body}</p>
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-500">
            {openData.category && <Badge variant="gray">{openData.category}</Badge>}
            <span>{openData.author?.name}</span>
            <span>{formatRelative(openData.createdAt)}</span>
            <span>{openData.views} views</span>
          </div>
        </Card>

        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{openData.answers.length} Answer{openData.answers.length !== 1 ? 's' : ''}</h3>
        {openData.answers.map((a) => (
          <Card key={a.id} className={`p-5 ${a.isAccepted ? 'border-l-4 border-l-emerald-500' : ''}`}>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{a.body}</p>
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{a.author?.name} · {formatRelative(a.createdAt)}</p>
          </Card>
        ))}

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Your answer</h3>
          <textarea value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} rows={3}
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            placeholder="Share your answer…" />
          <div className="flex justify-end mt-2">
            <button onClick={postAnswer} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#ff6d34' }}>
              <Send size={13} /> Post
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden p-5 sm:p-8 text-white shadow-xl mb-6"
        style={{ background: 'linear-gradient(135deg, #ff6d34 0%, #ff8c5f 100%)' }}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,#fff_1px,transparent_1px),radial-gradient(circle_at_80%_20%,#00bea3_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Q&A Forum</h1>
            <p className="opacity-90 mt-2 text-sm">Ask questions related to projects, meetings and internship tasks.</p>
          </div>
          <span className="text-sm px-4 py-1 self-start sm:self-auto rounded-full bg-white/20">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Ask a Question</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            className="flex-1 min-w-0 px-4 py-2.5 text-sm rounded-lg focus:outline-none transition border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            placeholder="Type your question…" />
          <button onClick={add} className="w-full sm:w-auto justify-center px-4 py-2.5 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition flex-shrink-0" style={{ background: '#ff6d34' }}>
            <Plus size={15} /> Post
          </button>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {APP_CONSTANTS.QA_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition`}
              style={{
                background: category === c ? '#ff6d34' : 'var(--card)',
                border: `1px solid ${category === c ? '#ff6d34' : 'var(--border)'}`,
                color: category === c ? '#ffffff' : 'var(--text)',
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((q) => (
          <Card key={q.id} hover className="p-5 cursor-pointer" onClick={() => open(q.id)}>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button onClick={(e) => upvote(q.id, e)} className="p-1.5 rounded-lg transition" style={{ color: 'var(--muted)' }}>
                  <ThumbsUp size={15} />
                </button>
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{q._count?.upvotes ?? 0}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold leading-snug text-slate-900 dark:text-white">{q.title}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                  {q.category && <Badge variant="gray">{q.category}</Badge>}
                  <span>{q.author?.name}</span>
                  <span>{formatRelative(q.createdAt)}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={11} /> {q._count?.answers ?? 0} answer{q._count?.answers !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p>No questions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QA;
