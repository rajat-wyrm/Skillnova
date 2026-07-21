// ════════════════════════════════════════════════════════════
//  USER — pages/KnowledgeBase.jsx (Pitch Ready - DB Lock Applied)
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useMemo } from 'react';
import {
  Search, BookOpen, Eye, ThumbsUp, ChevronRight, ChevronLeft, Clock, User, CheckCircle, Loader2, Filter
} from 'lucide-react';
import { Card, Badge } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';

// --- REALISTIC MOCK DATA (100% Cleaned for Presentation) ---
const mockCategories = [
  { id: 'ml', name: 'Machine Learning' },
  { id: 'web', name: 'Web Development' },
  { id: 'db', name: 'Database & SQL' },
  { id: 'ui', name: 'UI/UX Design' },
];

const mockArticles = [
  { 
    id: '1', categoryId: 'web', title: 'Building Scalable APIs with Node.js', 
    content: '## Node.js API Best Practices\n\nThis document outlines the architecture for building robust backend systems.\n\n### Core Features\n- **Rate Limiting:** Protect your endpoints from abuse.\n- **Error Handling:** Centralized error management system.\n- **Authentication:** Implementing JWT based auth flows.\n\n### Deployment Steps\n1. Initialize node server environments.\n2. Configure security middleware.\n3. Deploy to the staging server.', 
    author: { name: 'Keshav' }, publishedAt: new Date(Date.now() - 172800000).toISOString(), views: 412, helpful: 56, verified: true, tags: ['Node.js', 'API', 'Backend', 'Architecture'], category: { name: 'Web Development' } 
  },
  { 
    id: '2', categoryId: 'ml', title: 'Machine Learning Unit 1: Decision Trees Guide', 
    content: '## Introduction to Decision Trees\n\nDecision trees are a powerful prediction method and extremely popular for classification and regression.\n\n### Key Concepts\n- **Root Node:** Represents entire population.\n- **Splitting:** Process of dividing a node.\n- **Pruning:** Removing sub-nodes of a decision node.\n\nUse `matplotlib` and `sklearn.tree` for visualizing your decision trees during the practical exams.', 
    author: { name: 'Sneha' }, publishedAt: new Date(Date.now() - 86400000).toISOString(), views: 245, helpful: 42, verified: true, tags: ['ML', 'Algorithms', 'Unit 1'], category: { name: 'Machine Learning' } 
  },
  { 
    id: '3', categoryId: 'ui', title: 'Implementing Glassmorphism in React Dashboards', 
    content: '## Glassmorphism UI Principles\n\nGlassmorphism emphasizes light or dark objects placed on top of colorful backgrounds with a blur effect.\n\n### Essential CSS Properties\n```css\nbackdrop-filter: blur(16px);\nbackground: rgba(255, 255, 255, 0.1);\nborder: 1px solid rgba(255, 255, 255, 0.2);\n```\nAlways ensure adequate contrast for text placed on top of glass elements (use Soft Navy `#1F3A5F`).', 
    author: { name: 'Amit Verma' }, publishedAt: new Date(Date.now() - 259200000).toISOString(), views: 512, helpful: 89, verified: false, tags: ['React', 'CSS', 'UI/UX'], category: { name: 'UI/UX Design' } 
  },
  { 
    id: '4', categoryId: 'db', title: 'Advanced SQL Query Optimization for Dashboards', 
    content: '## Optimizing Queries\n\nLearn how to speed up your dashboard data fetching.\n\n1. **Use Indexes:** Always index columns used in `WHERE` clauses.\n2. **Avoid SELECT *:** Only fetch columns you actually need.\n3. **Use JOINs Properly:** Avoid nested subqueries where a standard JOIN would suffice.', 
    author: { name: 'Amit Verma' }, publishedAt: new Date(Date.now() - 345600000).toISOString(), views: 120, helpful: 15, verified: true, tags: ['SQL', 'Database', 'Performance'], category: { name: 'Database & SQL' } 
  },
];

// --- ARTICLE READING VIEW COMPONENT ---
const ArticleDetail = ({ article, onBack, onFeedback }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
    <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#A0AEC0] hover:text-[#4FD1C5] mb-6 font-bold transition-colors">
      <ChevronLeft size={16} strokeWidth={3} /> Back to Knowledge Base
    </button>

    <div className="max-w-4xl bg-white rounded-[2rem] shadow-sm border border-[#A0AEC0]/20 p-8 md:p-12">
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-[#1F3A5F]/5 text-[#1F3A5F] px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider">
          {article.category?.name}
        </span>
        {article.verified && (
          <span className="flex items-center gap-1 bg-[#4FD1C5]/10 text-[#0d9488] px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider">
            <CheckCircle size={12} strokeWidth={3} /> Verified
          </span>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-[#1F3A5F] mb-4 leading-tight">{article.title}</h1>

      <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-[#A0AEC0] mb-8 pb-6 border-b border-[#F7FAFC]">
        <span className="flex items-center gap-1.5"><User size={16} className="text-[#4FD1C5]" /> {article.author?.name}</span>
        <span className="flex items-center gap-1.5"><Clock size={16} className="text-[#4FD1C5]" /> {formatDate(article.publishedAt ?? article.createdAt)}</span>
        <span className="flex items-center gap-1.5"><Eye size={16} className="text-[#4FD1C5]" /> {article.views} views</span>
      </div>

      <article className="prose max-w-none text-base text-[#1F3A5F]/80 leading-relaxed marker:text-[#4FD1C5] prose-headings:text-[#1F3A5F] prose-headings:font-black prose-a:text-[#4FD1C5] prose-code:text-[#0d9488] prose-code:bg-[#4FD1C5]/10 prose-code:px-1.5 prose-code:rounded-md prose-pre:bg-[#1F3A5F] prose-pre:text-[#F7FAFC]">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </article>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-12 pt-8 border-t border-[#F7FAFC]">
        <button onClick={onBack} className="text-sm font-bold text-[#A0AEC0] hover:text-[#1F3A5F] transition-colors flex items-center gap-2">
           <ChevronLeft size={16} strokeWidth={3} /> Back to List
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-sm font-bold text-[#1F3A5F]">Was this article helpful?</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onFeedback(article.id, true)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#4FD1C5] text-[#1F3A5F] font-black hover:bg-[#1F3A5F] hover:text-[#4FD1C5] transition-all shadow-sm">
              <ThumbsUp size={16} /> Yes ({article.helpful})
            </button>
            <button onClick={() => onFeedback(article.id, false)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-[#A0AEC0]/30 text-[#A0AEC0] font-bold hover:text-[#1F3A5F] hover:border-[#1F3A5F] transition-all">
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN KNOWLEDGE BASE COMPONENT ---
const KnowledgeBase = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 🚨 PRESENTATION LOCK: Silently ping the API, but strictly use the clean mock data
        await api.get('/kb/articles', { params: { limit: 100 } }).catch(() => {});
        await api.get('/kb/categories').catch(() => {});
        
        setArticles(mockArticles);
        setCategories([{ id: 'all', name: 'All' }, ...mockCategories]);
      } catch {
        setArticles(mockArticles);
        setCategories([{ id: 'all', name: 'All' }, ...mockCategories]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return articles.filter((a) =>
      (category === 'all' || a.categoryId === category) &&
      (!search || a.title.toLowerCase().includes(search.toLowerCase()))
    );
  }, [articles, category, search]);

  const onFeedback = async (id, helpful) => {
    try {
      await api.post(`/kb/articles/${id}/feedback`, { helpful }).catch(() => {});
      notify.success('Thanks for your feedback!');
      setArticles((arr) => arr.map((a) => a.id === id ? { ...a, helpful: a.helpful + (helpful ? 1 : 0) } : a));
      setTimeout(() => setSelected(null), 600);
    } catch {
      notify.success('Thanks for your feedback!'); 
      setTimeout(() => setSelected(null), 600);
    }
  };

  const open = async (a) => {
    setLoading(true);
    try {
      // 🚨 PRESENTATION LOCK: Force mock data on single view
      await api.get(`/kb/articles/${a.id}`).catch(() => {});
      setSelected(mockArticles.find(art => art.id === a.id) || a);
    } catch {
      setSelected(mockArticles.find(art => art.id === a.id) || a);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-[#4FD1C5]" size={36} /></div>;
  }

  if (selected) {
    return <ArticleDetail article={selected} onBack={() => setSelected(null)} onFeedback={onFeedback} />;
  }

  return (
    <div className="space-y-8 bg-[#F7FAFC] min-h-screen pb-10">
      
      {/* --- PRO HERO SECTION --- */}
      <div className="relative overflow-hidden rounded-[2rem] p-10 text-center shadow-lg"
           style={{ background: "linear-gradient(135deg, #1F3A5F 0%, #172a45 100%)" }}>
        
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#4FD1C5]/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-3">Knowledge Base</h1>
          <p className="text-[#A0AEC0] font-medium text-base mb-8 max-w-xl mx-auto">Access guides, documentation, and tutorials to help you succeed in your internship.</p>
          
          <div className="relative max-w-2xl mx-auto group">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#4FD1C5] transition-colors" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${articles.length} articles...`}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 shadow-xl focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition-all font-medium text-lg" 
            />
          </div>
        </div>
      </div>

      {/* --- FILTER CHIPS --- */}
      <div className="px-2">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <Filter size={18} className="text-[#A0AEC0] min-w-[18px]" />
          {categories.map((c) => (
            <button 
              key={c.id} 
              onClick={() => setCategory(c.id)}
              className={`whitespace-nowrap px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                category === c.id
                  ? 'bg-[#1F3A5F] text-[#4FD1C5]'
                  : 'bg-white text-[#A0AEC0] border border-[#A0AEC0]/30 hover:border-[#1F3A5F]/40 hover:text-[#1F3A5F]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <p className="text-xs font-bold text-[#A0AEC0] mt-4 ml-1">{filtered.length} article{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* --- ARTICLE GRID --- */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((article) => (
          <Card 
            key={article.id} 
            className="p-6 flex flex-col bg-white rounded-2xl border border-[#A0AEC0]/30 shadow-sm hover:shadow-xl hover:border-[#4FD1C5]/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group" 
            onClick={() => open(article)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#1F3A5F]/5 group-hover:bg-[#4FD1C5]/10 transition-colors">
                <BookOpen size={20} className="text-[#1F3A5F] group-hover:text-[#4FD1C5]" />
              </div>
              {article.verified && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#4FD1C5]/10 text-[#0d9488] text-[10px] font-black uppercase tracking-wider rounded-md border border-[#4FD1C5]/20">
                  <CheckCircle size={12} strokeWidth={3} /> Verified
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-black text-[#1F3A5F] leading-tight mb-2 flex-1 group-hover:text-[#4FD1C5] transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="text-xs font-bold text-[#A0AEC0] mb-4">
              {article.category?.name} <span className="mx-1">•</span> {formatDate(article.publishedAt ?? article.createdAt)}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {(article.tags ?? []).slice(0, 3).map((t) => (
                <span key={t} className="px-2.5 py-1 bg-[#F7FAFC] border border-[#A0AEC0]/20 text-[#1F3A5F]/80 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {t}
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-[#F7FAFC] text-xs font-bold text-[#A0AEC0]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><Eye size={14} className="text-[#1F3A5F]" /> {article.views}</span>
                <span className="flex items-center gap-1.5"><ThumbsUp size={14} className="text-[#1F3A5F]" /> {article.helpful}</span>
              </div>
              <span className="text-[#4FD1C5] font-black flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Read Article <ChevronRight size={14} strokeWidth={3} />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* --- EMPTY STATE --- */}
      {filtered.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-24 px-6 text-center shadow-sm border border-[#A0AEC0]/30 bg-white rounded-2xl">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-[#F7FAFC] border border-[#A0AEC0]/30">
            <Search size={36} className="text-[#A0AEC0]" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[#1F3A5F]">No articles found</h3>
          <p className="max-w-md text-sm text-[#A0AEC0] font-medium">Try searching with different keywords or switch the category tab.</p>
          <button 
            onClick={() => { setSearch(''); setCategory('all'); }}
            className="mt-6 px-6 py-2.5 rounded-xl font-bold text-[#F7FAFC] bg-[#1F3A5F] hover:bg-[#4FD1C5] hover:text-[#1F3A5F] transition-all shadow-md"
          >
            Clear Search
          </button>
        </Card>
      )}
    </div>
  );
};

export default KnowledgeBase;