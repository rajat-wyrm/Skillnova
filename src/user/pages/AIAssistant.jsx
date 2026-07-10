// ════════════════════════════════════════════════════════════
//  AI Assistant — API-driven (streaming)
// ════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Bot, Zap, CheckCircle, Copy, Check, Loader2, MessageSquare, History, Trash2 } from 'lucide-react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { formatRelative } from '../../lib/utils';
import { APP_CONSTANTS } from '../../shared/config/constants';

const SUGGESTIONS = [
  'How do I submit my weekly report?',
  'Summarise my recent reports',
  "What's the attendance policy?",
  'Draft a meeting agenda for our Monday standup',
  'Explain the code-of-conduct highlights',
];

const CAPABILITIES = [
  'Grounded on UptoSkills KB',
  'Sees your live reports',
  'Streaming responses',
  'Cites knowledge base sections',
  'Multi-turn memory',
  'Markdown formatting',
];

const TypingIndicator = () => (
  <div className="flex items-end gap-2">
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
      <Sparkles size={12} className="text-white" />
    </div>
    <div className="px-4 py-3 rounded-2xl rounded-bl-sm"
      style={{ background: 'var(--chat-ai-bg)', border: '1px solid var(--chat-ai-border)' }}>
      <div className="flex gap-1 items-center h-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full"
            style={{ background: 'var(--muted)', animation: 'chatBounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  </div>
);

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`flex items-end gap-2 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ animation: 'chatFadeUp 0.22s ease both' }}>
      {isUser ? (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #ff6d34, #ff9a6c)' }}>U</div>
      ) : (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <Sparkles size={12} className="text-white" />
        </div>
      )}
      <div className={`flex flex-col gap-1 max-w-[min(28rem,78vw)] ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="text-xs font-medium px-1" style={{ color: 'var(--muted)' }}>
          {isUser ? 'You' : 'AI Assistant'}
        </span>
        <div className={`relative px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`}
          style={isUser
            ? { background: 'linear-gradient(135deg, #ff6d34, #ff8c5f)', color: '#ffffff' }
            : { background: 'var(--chat-ai-bg)', border: '1px solid var(--chat-ai-border)', color: 'var(--text)' }}>
          {msg.content}
          {!isUser && (
            <button onClick={handleCopy}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }} title="Copy">
              {copied ? <Check size={10} style={{ color: '#00bea3' }} /> : <Copy size={10} />}
            </button>
          )}
        </div>
        {msg.createdAt && (
          <span className="text-xs px-1" style={{ color: 'var(--muted)', opacity: 0.65 }}>
            {formatRelative(msg.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
};

const AIAssistant = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Initial greeting + load sessions
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Hello ${user?.name?.split(' ')[0] ?? 'there'}! 👋 I'm the SkillNova AI Assistant. I'm grounded on the UptoSkills knowledge base, so ask me anything about reports, attendance, mentorship, the platform or your career.`,
        createdAt: new Date().toISOString(),
      },
    ]);
    api.get('/ai/sessions').then((r) => setSessions(r.data.items)).catch(() => {});
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const loadSession = async (id) => {
    try {
      const { data } = await api.get(`/ai/sessions/${id}`);
      setMessages(data.session.messages);
      setSessionId(id);
      setShowHistory(false);
    } catch {
      /* ignore */
    }
  };

  const newSession = () => {
    setSessionId(null);
    setMessages([
      {
        role: 'assistant',
        content: 'New chat started. What would you like to know?',
        createdAt: new Date().toISOString(),
      },
    ]);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const deleteSession = async (id) => {
    try { await api.delete(`/ai/sessions/${id}`); setSessions((s) => s.filter((x) => x.id !== id)); } catch { /* ignore */ }
  };

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);
    setStreamingText('');

    const userMsg = { role: 'user', content: msg, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/ai/chat/stream`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', [APP_CONSTANTS.CSRF_HEADER]: getCookie(APP_CONSTANTS.CSRF_COOKIE) || '' },
        body: JSON.stringify({ message: msg, sessionId: sessionId ?? undefined }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let detectedSession = sessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.delta) {
              accumulated += payload.delta;
              setStreamingText(accumulated);
            }
            if (payload.done && payload.sessionId) {
              detectedSession = payload.sessionId;
            }
            if (payload.error) throw new Error(payload.error);
          } catch (e) {
            if (e instanceof Error) throw e;
          }
        }
      }

      const aiMsg = {
        role: 'assistant',
        content: accumulated || "I couldn't generate a response.",
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, aiMsg]);
      setStreamingText('');
      setSessionId(detectedSession);

      // Refresh session list
      api.get('/ai/sessions').then((r) => setSessions(r.data.items)).catch(() => {});
    } catch (err) {
      if (err.name === 'AbortError') return;
      const fallback = await api.post('/ai/chat', { message: msg, sessionId: sessionId ?? undefined })
        .catch(() => null);
      const reply = fallback?.data?.reply || "I'm having trouble connecting. Please try again.";
      setMessages((m) => [...m, { role: 'assistant', content: reply, createdAt: new Date().toISOString() }]);
      setStreamingText('');
      setSessionId(fallback?.data?.sessionId ?? sessionId);
    } finally {
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  };

  const userCount = messages.filter((m) => m.role === 'user').length;
  const aiCount = messages.filter((m) => m.role === 'assistant').length;

  return (
    <>
      <style>{`
        @keyframes chatFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes chatBounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-5px); opacity: 1; } }
        :root { --chat-ai-bg: #f1f5f9; --chat-ai-border: #e2e8f0; }
        .dark { --chat-ai-bg: rgba(255,255,255,0.07); --chat-ai-border: rgba(255,255,255,0.1); }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 4px; }
      `}</style>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 min-h-0 lg:h-[calc(100dvh-9rem)]">
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-[min(70dvh,32rem)] lg:min-h-0"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Bot size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>AI Knowledge Assistant</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#00bea3' }} />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Online · Groq · UptoSkills KB</span>
              </div>
            </div>
            <button onClick={() => setShowHistory((v) => !v)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              <History size={12} /> History
            </button>
            <button onClick={newSession}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition"
              style={{ background: '#ff6d34', color: '#fff' }}>
              New Chat
            </button>
          </div>

          {showHistory && (
            <div className="absolute right-6 top-20 w-72 max-h-[60vh] overflow-y-auto rounded-2xl shadow-2xl z-50"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Recent conversations</p>
              </div>
              {sessions.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>No past sessions.</p>
              ) : sessions.map((s) => (
                <div key={s.id} className="px-4 py-3 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <button onClick={() => loadSession(s.id)} className="flex-1 text-left">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{s.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{s._count?.messages ?? 0} msgs · {formatRelative(s.updatedAt)}</p>
                  </button>
                  <button onClick={() => deleteSession(s.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto chat-scroll px-5 py-5 flex flex-col gap-5">
            {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
            {streamingText && (
              <MessageBubble msg={{ role: 'assistant', content: streamingText + '▍', createdAt: new Date().toISOString() }} />
            )}
            {loading && !streamingText && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && !loading && (
            <div className="px-5 pb-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <p className="w-full text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Try asking:</p>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition"
                  style={{ background: 'var(--chat-ai-bg)', border: '1px solid var(--chat-ai-border)', color: 'var(--text)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff6d34'; e.currentTarget.style.color = '#ff6d34'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--chat-ai-border)'; e.currentTarget.style.color = 'var(--text)' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
              <MessageSquare size={14} style={{ color: 'var(--muted)' }} />
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask about reports, attendance, the platform, your career…"
                className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none"
                style={{ color: 'var(--text)' }} disabled={loading} />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition disabled:opacity-40"
                style={{ background: input.trim() && !loading ? 'linear-gradient(135deg, #ff6d34, #ff8c5f)' : 'var(--border)', color: input.trim() && !loading ? '#fff' : 'var(--muted)' }}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <p className="text-center text-xs mt-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>
              Press Enter to send · AI responses are grounded on UptoSkills KB · may be inaccurate
            </p>
          </div>
        </div>

        <div className="w-64 hidden lg:flex flex-col gap-4 flex-shrink-0">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Zap size={14} style={{ color: '#f59e0b' }} /> Capabilities
            </h3>
            <ul className="space-y-2.5">
              {CAPABILITIES.map((c) => (
                <li key={c} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <CheckCircle size={12} style={{ color: '#00bea3', flexShrink: 0 }} />
                  {c}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Suggested Prompts</h3>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="w-full text-left text-xs p-2.5 rounded-lg transition"
                  style={{ background: 'var(--chat-ai-bg)', border: '1px solid var(--chat-ai-border)', color: 'var(--muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff6d34'; e.currentTarget.style.color = '#ff6d34'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--chat-ai-border)'; e.currentTarget.style.color = 'var(--muted)' }}>
                  {s}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Session Stats</h3>
            <div className="space-y-2">
              {[
                { label: 'Messages sent', value: userCount },
                { label: 'AI replies',    value: aiCount },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--stat-tint-orange)', color: '#ff6d34' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(new RegExp('(^|;)\\s*' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[2]) : '';
}

export default AIAssistant;
