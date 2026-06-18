// ════════════════════════════════════════════════════════════════════
//  SkillNova AI Chatbot — frontend widget
//
//  A self-contained React component that talks to the Python backend
//  at <VITE_AI_API_URL>/api/chat. No coupling to the SkillNova React
//  app — drop the built bundle into any page as a floating chat bubble.
//
//  Usage:
//    <div id="skillnova-chatbot"></div>
//    <script src="/skillnova-chatbot.js"></script>
// ════════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

const API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';
const APP_NAME = import.meta.env.VITE_APP_NAME || 'SkillNova AI';
const MAX_MESSAGE_LENGTH = 2000;

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'sess-' + Math.random().toString(36).slice(2) + Date.now();
}

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `Hi! I'm ${APP_NAME}, your SkillNova assistant. Ask me anything about the internship, policies, or platform features.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    sessionRef.current = uuid();
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

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
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionRef.current }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
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
        { role: 'bot', content: `Network error: ${err.message}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close chat' : 'Open chat'}
        onClick={() => setOpen((o) => !o)}
        style={styles.bubble}
      >
        {open ? '×' : '💬'}
      </button>
      {open && (
        <div role="dialog" aria-label="SkillNova chat" style={styles.panel}>
          <header style={styles.header}>
            <strong>{APP_NAME}</strong>
            <button
              type="button"
              aria-label="Clear conversation"
              onClick={() =>
                setMessages([
                  {
                    role: 'bot',
                    content: `Conversation reset. How can I help you?`,
                  },
                ])
              }
              style={styles.headerBtn}
            >
              ↺
            </button>
          </header>
          <div ref={scrollRef} style={styles.scroll}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === 'user' ? styles.userMsg : styles.botMsg}>
                {m.content}
                {m.sources?.length > 0 && (
                  <div style={styles.sources}>
                    sources: {m.sources.join(', ')}
                  </div>
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
              placeholder="Ask about SkillNova…"
              disabled={busy}
              maxLength={MAX_MESSAGE_LENGTH}
              aria-label="Message"
              style={styles.input}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              style={styles.send}
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
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: 24,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    zIndex: 9999,
  },
  panel: {
    position: 'fixed',
    bottom: 90,
    right: 20,
    width: 360,
    maxWidth: 'calc(100vw - 40px)',
    height: 520,
    maxHeight: 'calc(100vh - 120px)',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    zIndex: 9999,
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    background: '#1e40af',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    background: '#2563eb',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: 12,
    margin: '4px 0',
    marginLeft: 'auto',
    maxWidth: '85%',
    whiteSpace: 'pre-wrap',
  },
  botMsg: {
    background: '#e5e7eb',
    color: '#111827',
    padding: '8px 12px',
    borderRadius: 12,
    margin: '4px 0',
    marginRight: 'auto',
    maxWidth: '85%',
    whiteSpace: 'pre-wrap',
  },
  sources: {
    marginTop: 6,
    fontSize: 11,
    opacity: 0.7,
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
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
};

function mount(el) {
  const root = createRoot(el);
  root.render(<ChatbotWidget />);
  return root;
}

export { ChatbotWidget, mount };

// Auto-mount when loaded standalone.
if (typeof window !== 'undefined') {
  const target = document.getElementById('skillnova-chatbot');
  if (target) mount(target);
}
