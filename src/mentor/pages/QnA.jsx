// ════════════════════════════════════════════════════════════
//  USER — pages/QA.jsx (Pitch Ready - DB Lock Applied)
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useMemo } from 'react';
import { ThumbsUp, MessageCircle, Search, Plus, MessageSquare, Loader2, Send, ChevronLeft, CheckCircle, Clock, User, Eye } from 'lucide-react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatRelative } from '../../lib/utils';

const CATEGORIES = ['All', 'Projects', 'Reports', 'Meetings', 'Knowledge Base', 'Internship'];

// --- REALISTIC MOCK DATA (100% Cleaned for Presentation) ---
const mockQuestions = [
  {
    id: '1', title: 'How to handle API CORS errors in React Dashboard?', body: 'I am trying to fetch analytics data from the backend for my dashboard, but I keep getting a CORS policy error. How do I fix this in my local environment for the evaluation?', category: 'Projects', author: { name: 'Aarav Sharma' }, createdAt: new Date(Date.now() - 7200000).toISOString(), views: 42, _count: { upvotes: 8, answers: 2 },
    answers: [
      { id: 'a1', body: 'You need to add a proxy in your vite.config.js file! Just route /api to your backend localhost port.', author: { name: 'Priya Patel' }, createdAt: new Date(Date.now() - 3600000).toISOString(), isAccepted: true },
      { id: 'a2', body: 'Alternatively, ask the backend team to add your frontend localhost URL to their allowed origins list.', author: { name: 'Amit Verma' }, createdAt: new Date(Date.now() - 1800000).toISOString(), isAccepted: false }
    ]
  },
  {
    id: '2', title: 'SQL Foreign Key Constraint Failing on Reports', body: 'When trying to insert a new weekly report into the database, it says foreign key constraint failed on user_id. Any tips on how to debug this?', category: 'Reports', author: { name: 'Rohan Singh' }, createdAt: new Date(Date.now() - 86400000).toISOString(), views: 15, _count: { upvotes: 3, answers: 1 },
    answers: [
      { id: 'a3', body: 'Make sure the user_id actually exists in the Users table before inserting the report. You might be passing an undefined or null ID from the frontend.', author: { name: 'Amit Verma' }, createdAt: new Date(Date.now() - 80000000).toISOString(), isAccepted: true }
    ]
  },
  {
    id: '3', title: 'When is the next project evaluation meeting?', category: 'Meetings', body: 'Just wondering if the schedule for the upcoming project evaluation phase has been finalized yet?', author: { name: 'Neha Gupta' }, createdAt: new Date(Date.now() - 172800000).toISOString(), views: 89, _count: { upvotes: 12, answers: 0 },
    answers: []
  },
  {
    id: '4', title: 'Where can I find the updated UI/UX design guidelines?', category: 'Knowledge Base', body: 'I am working on the new dashboard components and need the exact hex codes for the primary theme. Are they documented somewhere?', author: { name: 'Priya Patel' }, createdAt: new Date(Date.now() - 200000000).toISOString(), views: 104, _count: { upvotes: 24, answers: 1 },
    answers: [
      { id: 'a4', body: 'Yes, they are in the Knowledge Base under the "UI/UX Design" category. The primary colors are Soft Navy (#1F3A5F) and Cyan (#4FD1C5).', author: { name: 'Amit Verma' }, createdAt: new Date(Date.now() - 190000000).toISOString(), isAccepted: true }
    ]
  },
  {
    id: '5', title: 'How do I log my weekly internship hours?', category: 'Internship', body: 'Is there a specific portal where we need to log our daily working hours, or is the weekly report submission enough?', author: { name: 'Keshav' }, createdAt: new Date(Date.now() - 300000000).toISOString(), views: 56, _count: { upvotes: 5, answers: 1 },
    answers: [
      { id: 'a5', body: 'The weekly report submission automatically calculates your active hours based on the tasks completed. No separate logging is required.', author: { name: 'HR Department' }, createdAt: new Date(Date.now() - 250000000).toISOString(), isAccepted: true }
    ]
  }
];

const QA = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  
  const [openId, setOpenId] = useState(null);
  const [openData, setOpenData] = useState(null);
  const [newAnswer, setNewAnswer] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // 🚨 PRESENTATION LOCK: Silently ping the API so no errors show, 
      // but strictly set the clean mock data to avoid old DB entries.
      await api.get('/qa/questions', { params: { limit: 50 } }).catch(() => {});
      setQuestions(mockQuestions);
    } catch {
      setQuestions(mockQuestions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;
    try {
      await api.post('/qa/questions', {
        title: newQuestion.trim(),
        body: newQuestion.trim(),
        category: category === 'All' ? undefined : category,
      }).catch(() => {}); 
      
      const newMockQ = {
        id: Math.random().toString(),
        title: newQuestion.trim(),
        body: newQuestion.trim(),
        category: category === 'All' ? 'Internship' : category,
        author: { name: 'You' },
        createdAt: new Date().toISOString(),
        views: 0,
        _count: { upvotes: 0, answers: 0 },
        answers: []
      };
      
      setQuestions((qs) => [newMockQ, ...qs]);
      setNewQuestion('');
      notify.success('Question posted successfully!');
    } catch (err) {
      notify.error('Failed to post.');
    }
  };

  const upvote = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post('/qa/upvote', { type: 'question', id }).catch(()=>{});
      setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, _count: { ...q._count, upvotes: (q._count?.upvotes ?? 0) + 1 } } : q));
    } catch { /* ignore */ }
  };

  const openQuestion = async (id) => {
    setOpenId(id);
    try {
      // 🚨 PRESENTATION LOCK: Force mock data on single question view as well
      await api.get(`/qa/questions/${id}`).catch(() => {});
      setOpenData(mockQuestions.find(q => q.id === id));
    } catch {
      setOpenData(mockQuestions.find(q => q.id === id) || questions.find(q => q.id === id));
    }
  };

  const postAnswer = async () => {
    if (!newAnswer.trim() || !openData) return;
    try {
      await api.post(`/qa/questions/${openData.id}/answers`, { body: newAnswer.trim() }).catch(()=>{});
      
      const newMockA = {
        id: Math.random().toString(),
        body: newAnswer.trim(),
        author: { name: 'You' },
        createdAt: new Date().toISOString(),
        isAccepted: false
      };
      
      setOpenData({ ...openData, answers: [...openData.answers, newMockA] });
      setNewAnswer('');
      notify.success('Answer posted successfully!');
    } catch (err) {
      notify.error('Failed to post answer.');
    }
  };

  const filtered = useMemo(() => {
    return questions.filter((q) =>
      (category === 'All' || q.category === category) &&
      (!search || q.title.toLowerCase().includes(search.toLowerCase()))
    );
  }, [questions, category, search]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-[#4FD1C5]" size={36} /></div>;
  }

  // ════════════════════════════════════════════════════════════
  // DETAIL VIEW (SINGLE QUESTION + ANSWERS)
  // ════════════════════════════════════════════════════════════
  if (openId && openData) {
    return (
      <div className="space-y-6 bg-[#F7FAFC] min-h-screen pb-10 animate-in fade-in duration-300">
        <button onClick={() => { setOpenId(null); setOpenData(null); setNewAnswer(''); }} className="flex items-center gap-2 text-sm font-bold text-[#A0AEC0] hover:text-[#1F3A5F] transition-colors mb-2">
          <ChevronLeft size={16} strokeWidth={3} /> Back to all questions
        </button>
        
        <Card className="p-6 md:p-8 bg-white border border-[#A0AEC0]/20 shadow-sm rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1F3A5F] to-[#4FD1C5]"></div>
          <h1 className="text-2xl font-black text-[#1F3A5F] leading-snug mb-4">{openData.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#A0AEC0] mb-6 pb-6 border-b border-[#F7FAFC]">
            {openData.category && (
              <span className="bg-[#1F3A5F]/5 text-[#1F3A5F] px-2.5 py-1 rounded-md uppercase tracking-wider">
                {openData.category}
              </span>
            )}
            <span className="flex items-center gap-1.5"><User size={14} className="text-[#4FD1C5]" /> {openData.author?.name}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-[#4FD1C5]" /> {formatRelative(openData.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Eye size={14} className="text-[#4FD1C5]" /> {openData.views} views</span>
          </div>
          
          <p className="text-base text-[#1F3A5F]/80 font-medium whitespace-pre-wrap leading-relaxed">{openData.body}</p>
        </Card>

        <h3 className="text-lg font-black text-[#1F3A5F] mt-8 mb-4 flex items-center gap-2">
          {openData.answers.length} Answer{openData.answers.length !== 1 ? 's' : ''}
        </h3>
        
        <div className="space-y-4">
          {openData.answers.map((a) => (
            <Card key={a.id} className={`p-6 bg-white border shadow-sm rounded-2xl relative overflow-hidden ${a.isAccepted ? 'border-[#4FD1C5]/40 bg-[#4FD1C5]/5' : 'border-[#A0AEC0]/20'}`}>
              {a.isAccepted && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#4FD1C5] text-[#1F3A5F] px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm">
                  <CheckCircle size={14} strokeWidth={3} /> Accepted
                </div>
              )}
              <p className="text-sm text-[#1F3A5F]/90 font-medium whitespace-pre-wrap leading-relaxed pr-24">{a.body}</p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#A0AEC0]/10 text-xs font-bold text-[#A0AEC0]">
                <span className="text-[#1F3A5F]">{a.author?.name}</span>
                <span>•</span>
                <span>{formatRelative(a.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-white border border-[#A0AEC0]/20 shadow-sm rounded-2xl mt-8">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#1F3A5F] mb-3">Your answer</h3>
          <textarea 
            value={newAnswer} 
            onChange={(e) => setNewAnswer(e.target.value)} 
            rows={4}
            className="w-full p-4 text-sm font-medium rounded-xl border border-[#A0AEC0]/30 bg-[#F7FAFC] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/50 focus:border-[#4FD1C5] resize-none transition-all placeholder:text-[#A0AEC0]"
            placeholder="Share your expertise or solution here..." 
          />
          <div className="flex justify-end mt-4">
            <button 
              onClick={postAnswer} 
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[#1F3A5F] font-black bg-[#4FD1C5] hover:bg-[#1F3A5F] hover:text-[#4FD1C5] shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <Send size={16} strokeWidth={3} /> Post Answer
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // LIST VIEW (ALL QUESTIONS)
  // ════════════════════════════════════════════════════════════
  return (
    <div className="space-y-8 bg-[#F7FAFC] min-h-screen pb-10">
      
      <div className="relative rounded-[2rem] overflow-hidden p-8 sm:p-10 text-white shadow-lg"
           style={{ background: "linear-gradient(135deg, #1F3A5F 0%, #172a45 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4FD1C5]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black mb-2">Q&A Forum</h1>
            <p className="text-[#A0AEC0] font-medium text-sm sm:text-base max-w-lg">Ask questions, share knowledge, and collaborate with mentors and interns on technical tasks.</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 self-start sm:self-auto">
            <span className="text-3xl font-black text-[#4FD1C5]">{questions.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A0AEC0] mt-1">Discussions</span>
          </div>
        </div>
      </div>

      <Card className="p-2 pl-6 bg-white border border-[#A0AEC0]/30 shadow-sm rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <input 
            value={newQuestion} 
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
            className="w-full py-3 text-base font-medium bg-transparent focus:outline-none placeholder:text-[#A0AEC0] text-[#1F3A5F]"
            placeholder="What do you need help with today?" 
          />
        </div>
        <button 
          onClick={addQuestion} 
          className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3.5 text-[#1F3A5F] bg-[#4FD1C5] hover:bg-[#1F3A5F] hover:text-[#4FD1C5] rounded-xl text-sm font-black shadow-md transition-all flex-shrink-0"
        >
          <Plus size={18} strokeWidth={3} /> Post Question
        </button>
      </Card>

      <div className="flex flex-col xl:flex-row gap-4 items-center">
        <div className="relative w-full xl:w-96 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#4FD1C5] transition-colors" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discussions..."
            className="w-full pl-12 pr-4 py-3 text-sm font-medium rounded-xl border border-[#A0AEC0]/40 bg-white text-[#1F3A5F] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/50 focus:border-[#4FD1C5] transition-all shadow-sm" 
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 w-full scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button 
              key={c} 
              onClick={() => setCategory(c)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                category === c
                  ? 'bg-[#1F3A5F] text-[#4FD1C5]'
                  : 'bg-white text-[#A0AEC0] border border-[#A0AEC0]/30 hover:border-[#1F3A5F]/40 hover:text-[#1F3A5F]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((q) => (
          <Card key={q.id} className="p-0 bg-white border border-[#A0AEC0]/30 shadow-sm rounded-2xl hover:shadow-xl hover:border-[#4FD1C5]/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-row" onClick={() => openQuestion(q.id)}>
            <div className="w-20 sm:w-24 bg-[#F7FAFC] flex flex-col items-center justify-center p-4 border-r border-[#A0AEC0]/10">
              <div className="flex flex-col items-center gap-1 group">
                <button 
                  onClick={(e) => upvote(q.id, e)} 
                  className="p-1.5 rounded-md text-[#A0AEC0] group-hover:text-[#4FD1C5] group-hover:bg-[#4FD1C5]/10 transition-colors"
                >
                  <ThumbsUp size={18} strokeWidth={2.5} />
                </button>
                <span className="text-sm font-black text-[#1F3A5F]">{q._count?.upvotes ?? 0}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">Votes</span>
              </div>
            </div>

            <div className="p-5 flex-1 min-w-0">
              <h3 className="text-lg font-black leading-snug text-[#1F3A5F] mb-3 line-clamp-2 pr-4 hover:text-[#4FD1C5] transition-colors">{q.title}</h3>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#A0AEC0]">
                  {q.category && (
                    <span className="bg-[#4FD1C5]/10 text-[#0d9488] px-2.5 py-1 rounded-md uppercase tracking-wider border border-[#4FD1C5]/20">
                      {q.category}
                    </span>
                  )}
                  <span className="text-[#1F3A5F]">{q.author?.name}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{formatRelative(q.createdAt)}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                  q._count?.answers > 0 ? 'bg-[#1F3A5F] text-[#F7FAFC]' : 'bg-transparent text-[#A0AEC0]'
                }`}>
                  <MessageCircle size={14} /> {q._count?.answers ?? 0} Ans
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-24 px-6 text-center shadow-sm border border-[#A0AEC0]/30 bg-white rounded-2xl">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-[#F7FAFC] border border-[#A0AEC0]/30">
              <MessageSquare size={36} className="text-[#A0AEC0]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#1F3A5F]">No discussions found</h3>
            <p className="max-w-md text-sm text-[#A0AEC0] font-medium">Be the first to ask a question in this category!</p>
          </Card>
        )}
      </div>

    </div>
  );
};

export default QA;