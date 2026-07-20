import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Flame,
  Heart,
  Lightbulb,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import api, { getErrorMessage } from "../../lib/api";
const Panel = ({ children, className = "" }) => (
  <section
    className={"rounded-xl p-5 sm:p-6 " + className}
    style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      boxShadow: "var(--card-shadow)",
    }}
  >
    {children}
  </section>
);
const CommunityDashboard = () => {
  const [tab, setTab] = useState("Trending");
  const [search, setSearch] = useState(false);
  const [liked, setLiked] = useState({});
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});

  // dynamic data
  const [discussions, setDiscussions] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topics, setTopics] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiscussionForm, setShowDiscussionForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);

  const [discussionForm, setDiscussionForm] = useState({ title: '', body: '', topicId: '', tagIds: [] });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', type: '', gradient: '', icon: '', demoUrl: '', repoUrl: '', tagIds: [] });

  // pagination state
  const [discussionPage, setDiscussionPage] = useState(1);
  const [discussionTotal, setDiscussionTotal] = useState(0);
  const [loadingMoreDiscussions, setLoadingMoreDiscussions] = useState(false);
  const [projectPage, setProjectPage] = useState(1);
  const [projectTotal, setProjectTotal] = useState(0);
  const [loadingMoreProjects, setLoadingMoreProjects] = useState(false);

  // user community stats
  const [userStats, setUserStats] = useState({ replyCount: 0, pointsEarned: 0, badgeCount: 0 });

  // auto-dismiss errors
  const errorTimer = useRef(null);
  useEffect(() => {
    if (error) {
      errorTimer.current = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(errorTimer.current);
    }
  }, [error]);

  // derive filter params from active tab
  const getTabParams = useCallback((tabName) => {
    switch (tabName) {
      case 'Trending': return '&sort=trending';
      case 'Latest': return '&sort=latest';
      case 'Unanswered': return '&unanswered=true';
      case 'Following': return '&sort=latest'; // Following filter not yet supported, defaults to latest
      default: return '';
    }
  }, []);

  const submitAnswer = async (postId) => {
    const answer = (answerDrafts[postId] || '').trim();
    if (!answer) return;
    // optimistic UI
    setSubmittedAnswers((current) => ({ ...current, [postId]: answer }));
    setAnswerDrafts((current) => ({ ...current, [postId]: '' }));
    try {
      await api.post(`/community/discussions/${postId}/replies`, { body: answer });
      // refresh replies count for the post
      setDiscussions((cur) => cur.map(d => d.id === postId ? { ...d, replyCount: (d.replyCount || 0) + 1 } : d));
    } catch (e) {
      // revert optimistic change
      setSubmittedAnswers((current) => {
        const copy = { ...current };
        delete copy[postId];
        return copy;
      });
      setError(getErrorMessage(e));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dRes, pRes] = await Promise.all([
          api.get('/community/discussions?limit=8'),
          api.get('/community/projects?limit=6'),
        ]);
        const fetchedDiscussions = dRes.data.data || [];
        const fetchedProjects = pRes.data.data || [];
        setDiscussions(fetchedDiscussions);
        setDiscussionTotal(dRes.data.pagination?.total || 0);
        setProjectsList(fetchedProjects);
        setProjectTotal(pRes.data.pagination?.total || 0);

        // initialize liked states based on backend results
        const _liked = {};
        fetchedDiscussions.forEach(d => { if (d.hasUpvoted) _liked[d.id] = true; });
        fetchedProjects.forEach(p => { if (p.hasLiked) _liked[p.id] = true; });
        setLiked(_liked);

        // fetch topics, tags, and user stats for forms and sidebar
        try {
          const [tRes, tgRes, statsRes] = await Promise.all([
            api.get('/community/topics?limit=50'),
            api.get('/community/tags?limit=100'),
            api.get('/community/user/community-stats'),
          ]);
          setTopics(tRes.data.data || []);
          setTags(tgRes.data.data || []);
          if (statsRes.data.data) setUserStats(statsRes.data.data);
          // preselect first topic for convenience
          if (!discussionForm.topicId && (tRes.data.data || []).length > 0) {
            setDiscussionForm(f => ({ ...f, topicId: tRes.data.data[0].id }));
          }
        } catch (e) {
          // non-fatal
        }
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // search debounce (with tab filtering)
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const tabParams = getTabParams(tab);
        const res = await api.get(`/community/discussions?limit=12${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}${tabParams}`);
        const items = res.data.data || [];
        setDiscussions(items);
        setLiked(prev => {
          const l = { ...prev };
          items.forEach(d => { if (d.hasUpvoted !== undefined) l[d.id] = d.hasUpvoted; });
          return l;
        });
        setDiscussionTotal(res.data.pagination?.total || 0);
        setDiscussionPage(1);
      } catch (e) {
        setError(getErrorMessage(e));
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, tab, getTabParams]);

  const loadMoreDiscussions = async () => {
    const nextPage = discussionPage + 1;
    setLoadingMoreDiscussions(true);
    try {
      const tabParams = getTabParams(tab);
      const res = await api.get(`/community/discussions?page=${nextPage}&limit=8${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}${tabParams}`);
      const items = res.data.data || [];
      setDiscussions((cur) => [...cur, ...items]);
      setLiked(prev => {
        const l = { ...prev };
        items.forEach(d => { if (d.hasUpvoted !== undefined) l[d.id] = d.hasUpvoted; });
        return l;
      });
      setDiscussionPage(nextPage);
      setDiscussionTotal(res.data.pagination?.total || 0);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingMoreDiscussions(false);
    }
  };

  const loadMoreProjects = async () => {
    const nextPage = projectPage + 1;
    setLoadingMoreProjects(true);
    try {
      const res = await api.get(`/community/projects?page=${nextPage}&limit=6`);
      const items = res.data.data || [];
      setProjectsList((cur) => [...cur, ...items]);
      setLiked(prev => {
        const l = { ...prev };
        items.forEach(p => { if (p.hasLiked !== undefined) l[p.id] = p.hasLiked; });
        return l;
      });
      setProjectPage(nextPage);
      setProjectTotal(res.data.pagination?.total || 0);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingMoreProjects(false);
    }
  };

  const toggleProjectLike = async (projectId) => {
    const likedNow = !!liked[projectId];
    // optimistic
    setLiked((c) => ({ ...c, [projectId]: !likedNow }));
    setProjectsList((cur) => cur.map(p => p.id === projectId ? { ...p, likeCount: (p.likeCount || 0) + (likedNow ? -1 : 1) } : p));
    try {
      if (!likedNow) await api.post(`/community/projects/${projectId}/like`);
      else await api.delete(`/community/projects/${projectId}/like`);
    } catch (e) {
      // revert
      setLiked((c) => ({ ...c, [projectId]: likedNow }));
      setProjectsList((cur) => cur.map(p => p.id === projectId ? { ...p, likeCount: (p.likeCount || 0) + (likedNow ? 1 : -1) } : p));
      setError(getErrorMessage(e));
    }
  };

  const toggleDiscussionLike = async (postId) => {
    const likedNow = !!liked[postId];
    setLiked((c) => ({ ...c, [postId]: !likedNow }));
    setDiscussions((cur) => cur.map(d => d.id === postId ? { ...d, upvoteCount: (d.upvoteCount || 0) + (likedNow ? -1 : 1) } : d));
    try {
      if (!likedNow) await api.post(`/community/discussions/${postId}/upvote`);
      else await api.delete(`/community/discussions/${postId}/upvote`);
    } catch (e) {
      setLiked((c) => ({ ...c, [postId]: likedNow }));
      setDiscussions((cur) => cur.map(d => d.id === postId ? { ...d, upvoteCount: (d.upvoteCount || 0) + (likedNow ? 1 : -1) } : d));
      setError(getErrorMessage(e));
    }
  };

  const createDiscussion = async (type = 'DISCUSSION') => {
    setError(null);
    const finalTopicId = discussionForm.topicId || (topics.length > 0 ? topics[0].id : null);
    if (!discussionForm.title || !discussionForm.body || !finalTopicId) {
      setError('Title, body and topic are required.');
      return;
    }
    if (discussionForm.title.length < 5) {
      setError('Title must be at least 5 characters.');
      return;
    }
    if (discussionForm.body.length < 10) {
      setError('Body must be at least 10 characters.');
      return;
    }
    try {
      const payload = {
        title: discussionForm.title,
        body: discussionForm.body,
        type,
        topicId: finalTopicId,
        tagIds: discussionForm.tagIds || [],
      };
      const res = await api.post('/community/discussions', payload);
      const newPost = res.data.data;
      setDiscussions((c) => [newPost, ...c]);
      setShowDiscussionForm(false);
      setShowQuestionForm(false);
      setDiscussionForm({ title: '', body: '', topicId: discussionForm.topicId, tagIds: [] });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const createProject = async () => {
    setError(null);
    if (!projectForm.title || !projectForm.type) {
      setError('Project title and type required.');
      return;
    }
    if (projectForm.title.length < 3) {
      setError('Project title must be at least 3 characters.');
      return;
    }

    // auto-prepend https:// to URLs if user forgot, to prevent Zod strict URL validation crashing
    const sanitizeUrl = (url) => url && !/^https?:\/\//i.test(url) ? `https://${url}` : url;

    try {
      const payload = { ...projectForm, tagIds: projectForm.tagIds || [] };
      // remove empty url strings before sending, or sanitize
      if (payload.demoUrl) payload.demoUrl = sanitizeUrl(payload.demoUrl);
      else delete payload.demoUrl;

      if (payload.repoUrl) payload.repoUrl = sanitizeUrl(payload.repoUrl);
      else delete payload.repoUrl;

      const res = await api.post('/community/projects', payload);
      const newProject = res.data.data;
      setProjectsList((c) => [newProject, ...c]);
      setShowProjectForm(false);
      setProjectForm({ title: '', description: '', type: '', gradient: '', icon: '', demoUrl: '', repoUrl: '', tagIds: [] });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  // topic colors for sidebar display
  const topicColors = ['#7c3aed', '#ff6d34', '#00bea3', '#3b82f6', '#f59e0b'];

  return (
    <div className="space-y-5 pb-12 animate-fadeIn">
      {/* Error toast */}
      {error && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg animate-fadeIn"
          style={{ background: '#ef4444' }}
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold opacity-70 hover:opacity-100">✕</button>
        </div>
      )}
      <section
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background:
            "linear-gradient(120deg, #1a1f20 0%, #2d3436 58%, #174f4a 140%)",
        }}
      >
        <div
          className="absolute -right-8 -top-10 h-52 w-52 rounded-full opacity-20"
          style={{ background: "#00bea3", filter: "blur(8px)" }}
        />
        <div
          className="absolute bottom-[-90px] right-24 h-64 w-64 rounded-full opacity-20"
          style={{ border: "38px solid #ff6d34" }}
        />
        <div className="relative max-w-2xl">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
            style={{
              background: "rgba(0,190,163,.16)",
              color: "#65e9d7",
              border: "1px solid rgba(0,190,163,.28)",
            }}
          >
            <Sparkles size={14} /> Community space
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Learn together. Build together.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Ask questions, share your work, and grow with a community of curious
            builders.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setShowDiscussionForm(true);
                setShowQuestionForm(false);
              }}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Plus size={17} /> Start a discussion
            </button>
            <button
              onClick={() => {
                setShowQuestionForm(true);
                setShowDiscussionForm(false);
              }}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,.2)" }}
            >
              <CircleHelp size={17} /> Ask a doubt
            </button>
          </div>
        </div>
        {/* Modal forms for discussion/question */}
        {(showDiscussionForm || showQuestionForm) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <Panel className="w-full max-w-xl shadow-2xl relative">
              <button
                onClick={() => { setShowDiscussionForm(false); setShowQuestionForm(false); }}
                className="absolute right-5 top-5 px-2 py-1 text-sm font-bold hover:opacity-100 opacity-60 transition-opacity"
                style={{ color: "var(--text)" }}
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>
                {showQuestionForm ? 'Ask a question' : 'Start a discussion'}
              </h3>
              <div className="flex flex-col gap-3">
                <input value={discussionForm.title} onChange={(e) => setDiscussionForm(f => ({ ...f, title: e.target.value }))} placeholder="Title (minimum 5 characters)" className="w-full rounded-md px-3 py-2.5 font-bold" style={{ color: "var(--text)", background: "var(--input-bg)", border: "1px solid var(--border)" }} />
                <textarea value={discussionForm.body} onChange={(e) => setDiscussionForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your post... (minimum 10 characters)" className="w-full rounded-md px-3 py-2.5" rows={5} style={{ color: "var(--text)", background: "var(--input-bg)", border: "1px solid var(--border)" }} />
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <select value={discussionForm.topicId} onChange={(e) => setDiscussionForm(f => ({ ...f, topicId: e.target.value }))} className="rounded-md px-2 py-2 text-sm font-semibold" style={{ color: "var(--text)", background: "var(--input-bg)", border: "1px solid var(--border)" }}>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-2 items-center">
                    {tags.slice(0, 6).map(t => {
                      const selected = discussionForm.tagIds?.includes(t.id);
                      return (
                        <button key={t.id} onClick={() => setDiscussionForm(f => ({ ...f, tagIds: f.tagIds.includes(t.id) ? f.tagIds.filter(x => x !== t.id) : [...f.tagIds, t.id] }))} className="rounded-full px-2.5 py-1 text-xs font-bold transition-all" style={{ background: selected ? t.color : 'var(--bg-soft)', color: selected ? '#fff' : 'var(--text-soft)' }}>
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => createDiscussion(showQuestionForm ? 'QUESTION' : 'DISCUSSION')} className="rounded-md px-4 py-2 font-bold transition-transform hover:scale-105" style={{ background: '#00bea3', color: '#fff' }}>Post</button>
                  <button onClick={() => { setShowDiscussionForm(false); setShowQuestionForm(false); }} className="rounded-md px-4 py-2 font-semibold hover:opacity-80" style={{ background: 'var(--bg-soft)', color: 'var(--text)' }}>Cancel</button>
                </div>
              </div>
            </Panel>
          </div>
        )}
      </section>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[.18em]"
                style={{ color: "#ff6d34" }}
              >
                Community pulse
              </p>
              <h2
                className="mt-1 text-xl font-bold"
                style={{ color: "var(--text)" }}
              >
                Discussion forum
              </h2>
            </div>
            <button
              onClick={() => setSearch(!search)}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
              style={{
                color: "var(--text-soft)",
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
              }}
            >
              <Search size={16} /> Search discussions
            </button>
          </div>
          {search && (
            <input
              autoFocus
              className="mt-4 w-full rounded-lg px-3 py-2.5 text-sm"
              placeholder="Search topics, tags, or members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                color: "var(--text)",
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
              }}
            />
          )}
          <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
            {["Trending", "Latest", "Following", "Unanswered"].map((name) => (
              <button
                key={name}
                onClick={() => setTab(name)}
                className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold"
                style={{
                  background: tab === name ? "#ff6d34" : "var(--bg-soft)",
                  color: tab === name ? "#fff" : "var(--text-soft)",
                }}
              >
                {name}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 py-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full" style={{ background: 'var(--bg-soft)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 rounded" style={{ background: 'var(--bg-soft)' }} />
                    <div className="h-4 w-3/4 rounded" style={{ background: 'var(--bg-soft)' }} />
                    <div className="h-3 w-32 rounded" style={{ background: 'var(--bg-soft)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 divide-y" style={{ borderColor: "var(--border)" }}>
              {discussions.map((d) => {
                const tag = d.tags?.[0];
                const authorName = d.author?.name || 'Unknown';
                const initials = authorName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
                const color = tag?.color || '#7c3aed';
                const time = new Date(d.createdAt).toLocaleString();
                return (
                  <article key={d.id} className="flex gap-3 py-4 first:pt-1">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: color }}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {tag && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: tag.color, background: tag.color + '1c' }}>{tag.name}</span>
                        )}
                        {d.isHot && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: "#f59e0b" }}>
                            <Flame size={12} /> Hot
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 text-sm font-bold leading-snug" style={{ color: "var(--text)" }}>{d.title}</h3>
                      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{authorName} - {time}</p>
                    </div>
                    <div className="flex flex-col items-end justify-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                      <span className="inline-flex items-center gap-1"><MessageCircle size={14} /> {d.replyCount || 0}</span>
                      <button onClick={() => toggleDiscussionLike(d.id)} className="inline-flex items-center gap-1" style={{ color: liked[d.id] ? '#ff6d34' : 'var(--muted)' }}>
                        <Heart size={14} fill={liked[d.id] ? 'currentColor' : 'none'} /> {d.upvoteCount || 0}
                      </button>
                    </div>
                  </article>
                );
              })}
              {discussions.length === 0 && !loading && (
                <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>No discussions found.</p>
              )}
            </div>
          )}
          {discussions.length < discussionTotal && (
            <button
              onClick={loadMoreDiscussions}
              disabled={loadingMoreDiscussions}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold"
              style={{ color: "#ff6d34" }}
            >
              {loadingMoreDiscussions ? 'Loading...' : <>View all discussions <ArrowRight size={16} /></>}
            </button>
          )}
        </Panel>
        <aside className="space-y-5">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[.18em]"
                  style={{ color: "#00bea3" }}
                >
                  Community
                </p>
                <h2
                  className="mt-1 text-lg font-bold"
                  style={{ color: "var(--text)" }}
                >
                  Your impact
                </h2>
              </div>
              <Award size={24} style={{ color: "#f59e0b" }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                [String(userStats.replyCount || 0), "Replies"],
                [String(userStats.pointsEarned || 0), "Points"],
                [String(userStats.badgeCount || 0), "Badges"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-lg py-3"
                  style={{ background: "var(--bg-soft)" }}
                >
                  <p className="font-black" style={{ color: "var(--text)" }}>
                    {value}
                  </p>
                  <p
                    className="mt-0.5 text-[10px] font-semibold"
                    style={{ color: "var(--muted)" }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text)" }}
              >
                Topics to explore
              </h2>
              <MoreHorizontal size={19} style={{ color: "var(--muted)" }} />
            </div>
            <div className="mt-4 space-y-2">
              {(topics.length > 0 ? topics.slice(0, 5) : [
                { id: '1', name: "React", memberCount: 0 },
                { id: '2', name: "UI/UX Design", memberCount: 0 },
                { id: '3', name: "Career & Jobs", memberCount: 0 },
              ]).map((topic, idx) => {
                const color = topicColors[idx % topicColors.length];
                const memberLabel = topic.memberCount >= 1000 ? `${(topic.memberCount / 1000).toFixed(1)}k members` : `${topic.memberCount || 0} members`;
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSearchQuery('');
                      setTab('Latest');
                      // filter discussions by topic - re-fetch
                      api.get(`/community/discussions?limit=12&topic=${topic.id}`).then(res => {
                        const items = res.data.data || [];
                        setDiscussions(items);
                        setLiked(prev => {
                          const l = { ...prev };
                          items.forEach(d => { if (d.hasUpvoted !== undefined) l[d.id] = d.hasUpvoted; });
                          return l;
                        });
                        setDiscussionTotal(res.data.pagination?.total || 0);
                        setDiscussionPage(1);
                      }).catch(() => { });
                    }}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:opacity-75"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: color }}
                    />
                    <span
                      className="flex-1 text-sm font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {topic.name}
                      <small
                        className="block text-xs font-normal"
                        style={{ color: "var(--muted)" }}
                      >
                        {memberLabel}
                      </small>
                    </span>
                    <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                  </button>
                );
              })}
            </div>
          </Panel>
        </aside>
      </div>
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[.18em]"
              style={{ color: "#00bea3" }}
            >
              Get unstuck
            </p>
            <h2
              className="mt-1 text-xl font-bold"
              style={{ color: "var(--text)" }}
            >
              Doubt-solving corner
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Questions from members waiting for a helpful answer.
            </p>
          </div>
          <button
            onClick={() => {
              setShowQuestionForm(true);
              setShowDiscussionForm(false);
            }}
            className="inline-flex self-start items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold text-white"
            style={{ background: "#00bea3" }}
          >
            <Send size={15} /> Ask a question
          </button>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {discussions.filter(d => d.type === 'QUESTION').slice(0, 3).map((q) => {
            const submittedAnswer = submittedAnswers[q.id];
            const answerCount = (q.replyCount || 0) + (submittedAnswer ? 1 : 0);
            const subject = q.topic?.name || 'General';
            return (
              <article key={q.id} className="rounded-xl p-4" style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold" style={{ color: "#7c3aed" }}>
                  <BookOpen size={13} /> {subject}
                </span>
                <h3 className="mt-2 min-h-11 text-sm font-bold leading-snug" style={{ color: "var(--text)" }}>{q.title}</h3>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold" style={{ color: "var(--muted)" }}>{answerCount} answers</span>
                  <span className="font-bold" style={{ color: "#00a98f" }}>{q.author?.name || 'Someone'}</span>
                </div>
                {submittedAnswer && (
                  <div className="mt-3 rounded-lg p-2.5 text-xs" style={{ background: "rgba(0,190,163,.10)", border: "1px solid rgba(0,190,163,.2)", color: "var(--text-soft)" }}>
                    <span className="font-bold" style={{ color: "#00a98f" }}>Your answer</span>
                    <p className="mt-1 leading-relaxed">{submittedAnswer}</p>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <input
                    value={answerDrafts[q.id] || ""}
                    onChange={(event) => setAnswerDrafts((current) => ({ ...current, [q.id]: event.target.value }))}
                    onKeyDown={(event) => { if (event.key === "Enter") submitAnswer(q.id); }}
                    className="min-w-0 flex-1 rounded-lg px-2.5 py-2 text-xs"
                    placeholder="Write an answer..."
                    aria-label={`Answer: ${q.title}`}
                    style={{ color: "var(--text)", background: "var(--card)", border: "1px solid var(--border)" }}
                  />
                  <button
                    onClick={() => submitAnswer(q.id)}
                    disabled={!answerDrafts[q.id]?.trim()}
                    className="inline-flex items-center justify-center rounded-lg px-2.5 text-white"
                    style={{ background: "#00bea3" }}
                    title="Submit answer"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[.18em]"
              style={{ color: "#ff6d34" }}
            >
              Made by the community
            </p>
            <h2
              className="mt-1 text-xl font-bold"
              style={{ color: "var(--text)" }}
            >
              Project showcase
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Fresh ideas and thoughtful work from fellow creators.
            </p>
          </div>
          <button
            onClick={() => setShowProjectForm(true)}
            className="inline-flex self-start items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold"
            style={{ color: "#ff6d34", background: "rgba(255,109,52,.10)" }}
          >
            <Plus size={16} /> Share your project
          </button>
        </div>
        {/* Modal form for project sharing */}
        {showProjectForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <Panel className="w-full max-w-xl shadow-2xl relative">
              <button
                onClick={() => setShowProjectForm(false)}
                className="absolute right-5 top-5 px-2 py-1 text-sm font-bold hover:opacity-100 opacity-60 transition-opacity"
                style={{ color: "var(--text)" }}
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Share your project</h3>
              <div className="flex flex-col gap-3">
                <input value={projectForm.title} onChange={(e) => setProjectForm(f => ({ ...f, title: e.target.value }))} placeholder="Project title (min 3 chars)" className="w-full rounded-md px-3 py-2.5 font-bold" style={{ color: "var(--text)", background: "var(--input-bg)", border: "1px solid var(--border)" }} />
                <input value={projectForm.type} onChange={(e) => setProjectForm(f => ({ ...f, type: e.target.value }))} placeholder="Type (e.g. Productivity app, Portfolio)" className="w-full rounded-md px-3 py-2.5" style={{ color: "var(--text)", background: "var(--input-bg)", border: "1px solid var(--border)" }} />
                <textarea value={projectForm.description} onChange={(e) => setProjectForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" className="w-full rounded-md px-3 py-2.5" rows={3} style={{ color: "var(--text)", background: "var(--input-bg)", border: "1px solid var(--border)" }} />
                <div className="flex gap-3 items-center">
                  <input value={projectForm.demoUrl} onChange={(e) => setProjectForm(f => ({ ...f, demoUrl: e.target.value }))} placeholder="Live Demo URL (optional)" className="rounded-md px-3 py-2 flex-1" style={{ color: "var(--text)", background: "var(--input-bg)", border: "1px solid var(--border)" }} />
                  <input value={projectForm.repoUrl} onChange={(e) => setProjectForm(f => ({ ...f, repoUrl: e.target.value }))} placeholder="Repo URL (optional)" className="rounded-md px-3 py-2 flex-1" style={{ color: "var(--text)", background: "var(--input-bg)", border: "1px solid var(--border)" }} />
                </div>
                <div className="flex gap-2 items-center flex-wrap mt-1">
                  {tags.slice(0, 6).map(t => {
                    const selected = projectForm.tagIds?.includes(t.id);
                    return (
                      <button key={t.id} onClick={() => setProjectForm(f => ({ ...f, tagIds: f.tagIds.includes(t.id) ? f.tagIds.filter(x => x !== t.id) : [...f.tagIds, t.id] }))} className="rounded-full px-2.5 py-1 text-xs font-bold transition-all" style={{ background: selected ? t.color : 'var(--bg-soft)', color: selected ? '#fff' : 'var(--text-soft)' }}>{t.name}</button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => createProject()} className="rounded-md px-4 py-2 font-bold transition-transform hover:scale-105" style={{ background: '#ff6d34', color: '#fff' }}>Share project</button>
                  <button onClick={() => setShowProjectForm(false)} className="rounded-md px-4 py-2 font-semibold hover:opacity-80" style={{ background: 'var(--bg-soft)', color: 'var(--text)' }}>Cancel</button>
                </div>
              </div>
            </Panel>
          </div>
        )}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projectsList.map((p) => {
            const title = p.title;
            const type = p.type || p.description;
            const author = p.author?.name || 'Unknown';
            const initials = author.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
            const gradient = p.gradient || 'linear-gradient(135deg, #7c3aed, #ec4899)';
            const icon = p.icon || title?.[0]?.toUpperCase();
            const likes = p.likeCount || 0;
            return (
              <article key={p.id} className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                <div className="relative flex h-32 items-center justify-center" style={{ background: gradient }}>
                  <span className="text-5xl font-black text-white/90">{icon}</span>
                  <button
                    onClick={() => {
                      const url = p.demoUrl || p.repoUrl;
                      if (url) window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-white"
                    style={{ background: "rgba(0,0,0,.18)" }}
                    title={p.demoUrl ? "Open demo" : p.repoUrl ? "Open repository" : "No link available"}
                  >
                    <ExternalLink size={15} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold" style={{ color: "var(--text)" }}>{title}</h3>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{type}</p>
                    </div>
                    <button onClick={() => toggleProjectLike(p.id)} className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: liked[p.id] ? "#ff6d34" : "var(--muted)" }}>
                      <Heart size={15} fill={liked[p.id] ? "currentColor" : "none"} /> {likes}
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-black text-white" style={{ background: gradient }}>{initials}</span> By {author}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {projectsList.length < projectTotal && (
          <button
            onClick={loadMoreProjects}
            disabled={loadingMoreProjects}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold"
            style={{ color: "#ff6d34" }}
          >
            {loadingMoreProjects ? 'Loading...' : <>Explore all projects <ArrowRight size={16} /></>}
          </button>
        )}
      </Panel>
      <button
        title="Open community assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg hover:scale-105"
        style={{ background: "linear-gradient(135deg, #ff6d34, #00bea3)" }}
      >
        <Lightbulb size={23} />
      </button>
    </div>
  );
};
export default CommunityDashboard;
