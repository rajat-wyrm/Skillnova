// ════════════════════════════════════════════════════════════════════
//  AIAssistant.jsx — global floating chat widget
//
//  Mounts on every page in the SkillNova app and is available to
//  every role (SUPER_ADMIN, ADMIN, MENTOR, INTERN). Talks to the
//  Python AIAssistant backend at /api/aiassistant (proxied by Vite
//  in dev and by nginx in prod).
// ════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';

const APP_NAME = 'AIAssistant';
const API_BASE = '/api/aiassistant';
const MAX_MESSAGE_LENGTH = 2000;
const STORAGE_PREFIX = 'aiassistant:session:';

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'sess-' + Math.random().toString(36).slice(2) + Date.now();
}

function readSessionId(role) {
  try {
    const key = `${STORAGE_PREFIX}${role}`;
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = uuid();
      window.localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return uuid();
  }
}

function resetSessionId(role) {
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${role}`);
  } catch {
    /* ignore */
  }
}

const ROLE_COLORS = {
  SUPER_ADMIN: { from: '#7c3aed', to: '#ec4899' },
  ADMIN: { from: '#4f46e5', to: '#06b6d4' },
  MENTOR: { from: '#0ea5e9', to: '#22c55e' },
  INTERN: { from: '#4f46e5', to: '#06b6d4' },
};

export default function AIAssistant({ role = 'INTERN', userName = null }) {
  const palette = ROLE_COLORS[role] || ROLE_COLORS.INTERN;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `Hi${userName ? ` ${userName}` : ''}! I'm ${APP_NAME}, your SkillNova assistant. Ask me anything about the internship, policies, or platform features.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    sessionRef.current = readSessionId(role);
  }, [role]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function sendMessage(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      setMessages((m) => [
        ...m,
        { role: 'bot', content: `Message is too long (max ${MAX_MESSAGE_LENGTH} chars).` },
      ]);
      return;
    }

    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setBusy(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionRef.current,
          user_role: role,
          user_name: userName,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: 'bot',
          content: data.reply || 'Sorry, something went wrong.',
          sources: data.sources || [],
          confidence: data.confidence ?? null,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'bot', content: `AIAssistant is unreachable. (${err.message || 'network error'})` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function resetConversation() {
    resetSessionId(role);
    sessionRef.current = readSessionId(role);
    setMessages([
      {
        role: 'bot',
        content: `Conversation reset. How can I help you, ${role.toLowerCase()}?`,
      },
    ]);
  }

  return (
    <>
      <button
        type="button"
        aria-label={open ? `Close ${APP_NAME}` : `Open ${APP_NAME}`}
        title={`${APP_NAME} (${role})`}
        onClick={() => setOpen((o) => !o)}
        style={{
          ...styles.bubble,
          background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
        }}
      >
        {open ? '×' : 'AI'}
      </button>
      {open && (
        <div role="dialog" aria-label={APP_NAME} style={styles.panel}>
          <header
            style={{
              ...styles.header,
              background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
            }}
          >
            <div>
              <strong>{APP_NAME}</strong>
              <span style={styles.roleTag}>{role}</span>
            </div>
            <button
              type="button"
              aria-label="Reset conversation"
              onClick={resetConversation}
              style={styles.headerBtn}
            >
              ↺
            </button>
          </header>
          <div ref={scrollRef} style={styles.scroll}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === 'user' ? styles.userMsg : styles.botMsg}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                {m.sources?.length > 0 && (
                  <div style={styles.sources}>sources: {m.sources.join(', ')}</div>
                )}
              </div>
            ))}
            {busy && <div style={styles.botMsg}>…thinking…</div>}
          </div>
          <form onSubmit={sendMessage} style={styles.form}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${APP_NAME} anything…`}
              disabled={busy}
              maxLength={MAX_MESSAGE_LENGTH}
              aria-label="Message"
              style={styles.input}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              style={{
                ...styles.send,
                background: palette.from,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const styles = {
  bubble: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: '50%',
    border: 'none',
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 28px rgba(15,23,42,0.28)',
    zIndex: 9999,
  },
  panel: {
    position: 'fixed',
    bottom: 94,
    right: 20,
    width: 380,
    maxWidth: 'calc(100vw - 40px)',
    height: 540,
    maxHeight: 'calc(100vh - 130px)',
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 18px 48px rgba(0,0,0,0.22)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    zIndex: 9999,
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleTag: {
    marginLeft: 10,
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.18)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerBtn: {
    background: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 6,
    padding: '2px 8px',
    cursor: 'pointer',
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    padding: 12,
    background: '#f9fafb',
  },
  userMsg: {
    background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: 12,
    margin: '4px 0',
    marginLeft: 'auto',
    maxWidth: '85%',
  },
  botMsg: {
    background: '#eef2ff',
    color: '#111827',
    padding: '8px 12px',
    borderRadius: 12,
    margin: '4px 0',
    marginRight: 'auto',
    maxWidth: '85%',
  },
  sources: {
    marginTop: 6,
    fontSize: 11,
    opacity: 0.65,
  },
  form: {
    display: 'flex',
    borderTop: '1px solid #e5e7eb',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: 'none',
    outline: 'none',
    fontSize: 14,
  },
  send: {
    padding: '0 16px',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
};
