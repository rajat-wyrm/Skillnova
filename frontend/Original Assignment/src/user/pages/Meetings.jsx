// ══════════════════════════════════════════════
//  USER — pages/Meetings.jsx  (AI Assistant)
//  Task: Improve Chat Bubble UI — Kavya Sree
//  Redesigned for better readability, spacing,
//  and visual hierarchy (user vs AI messages).
// ══════════════════════════════════════════════

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, Zap, CheckCircle, Copy, Check } from "lucide-react";
import { Card } from "../../shared/components/UI";

const SUGGESTIONS = [
  "Summarize this month's activity",
  "How do I submit a report?",
  "Generate a meeting notes template",
  "What are the internship guidelines?",
];

const CAPABILITIES = [
  "Summarize Knowledge Articles",
  "Generate Meeting Notes",
  "Suggest Related Documents",
  "Auto-Tag Content",
  "Answer Team Questions",
  "Draft Report Outlines",
];

/* ── Typing indicator ─────────────────────── */
const TypingIndicator = () => (
  <div className="flex items-end gap-2">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
    >
      <Sparkles size={12} className="text-white" />
    </div>
    <div
      className="px-4 py-3 rounded-2xl rounded-bl-sm"
      style={{
        background: "var(--chat-ai-bg)",
        border: "1px solid var(--chat-ai-border)",
      }}
    >
      <div className="flex gap-1 items-center h-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: "var(--muted)",
              animation: "chatBounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

/* ── Single message bubble ───────────────── */
const MessageBubble = ({ msg }) => {
  const isUser = msg.type === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className={`flex items-end gap-2 group ${isUser ? "flex-row-reverse" : "flex-row"}`}
      style={{ animation: "chatFadeUp 0.22s ease both" }}
    >
      {/* Avatar */}
      {isUser ? (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #ff6d34, #ff9a6c)" }}
        >
          U
        </div>
      ) : (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
        >
          <Sparkles size={12} className="text-white" />
        </div>
      )}

      {/* Bubble + meta */}
      <div
        className={`flex flex-col gap-1 max-w-[min(28rem,78vw)] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Sender label */}
        <span
          className="text-xs font-medium px-1"
          style={{ color: "var(--muted)" }}
        >
          {isUser ? "You" : "AI Assistant"}
        </span>

        {/* Bubble */}
        <div
          className={`relative px-4 py-3 text-sm leading-relaxed ${
            isUser ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"
          }`}
          style={
            isUser
              ? { background: "linear-gradient(135deg, #ff6d34, #ff8c5f)", color: "#ffffff" }
              : {
                  background: "var(--chat-ai-bg)",
                  border: "1px solid var(--chat-ai-border)",
                  color: "var(--text)",
                }
          }
        >
          {msg.text}

          {/* Copy button — AI messages only, visible on group hover */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--muted)",
              }}
              title="Copy message"
            >
              {copied ? (
                <Check size={10} style={{ color: "#00bea3" }} />
              ) : (
                <Copy size={10} />
              )}
            </button>
          )}
        </div>

        {/* Timestamp */}
        {msg.time && (
          <span
            className="text-xs px-1"
            style={{ color: "var(--muted)", opacity: 0.65 }}
          >
            {msg.time}
          </span>
        )}
      </div>
    </div>
  );
};

/* ── Main component ──────────────────────── */
const Meetings = () => {
  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const [messages, setMessages] = useState([
    {
      type: "ai",
      text: "Hello! 👋 I'm your AI Knowledge Assistant. I can help you find articles, summarize content, answer questions and more. What would you like to know?",
      time: formatTime(new Date()),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const callClaude = async (userMessage) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(r => setTimeout(r, 1500));
      return "I can definitely help with that. Since I'm the consolidated version, I'm now powered by your team's best UI contributions!";
    } catch {
      return "I'm having trouble connecting. Please try again in a moment.";
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    inputRef.current?.focus();

    const now = new Date();
    setMessages((m) => [...m, { type: "user", text: msg, time: formatTime(now) }]);
    const reply = await callClaude(msg);
    setMessages((m) => [...m, { type: "ai", text: reply, time: formatTime(new Date()) }]);
  };

  const userCount = messages.filter((m) => m.type === "user").length;
  const aiCount   = messages.filter((m) => m.type === "ai").length;

  return (
    <>
      <style>{`
        @keyframes chatFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        :root {
          --chat-ai-bg:     #f1f5f9;
          --chat-ai-border: #e2e8f0;
        }
        .dark {
          --chat-ai-bg:     rgba(255,255,255,0.07);
          --chat-ai-border: rgba(255,255,255,0.1);
        }
        .chat-scroll::-webkit-scrollbar        { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track  { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb  { background: rgba(128,128,128,0.25); border-radius: 4px; }
      `}</style>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 min-h-0 lg:h-[calc(100dvh-9rem)]">

        {/* ── Chat Panel ─────────────────────────── */}
        <div
          className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-[min(70dvh,32rem)] lg:min-h-0"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
            >
              <Bot size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                AI Knowledge Assistant
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#00bea3" }} />
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  Online · Powered by SkillNova
                </span>
              </div>
            </div>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
              style={{
                background: "var(--stat-tint-orange)",
                color: "#ff6d34",
                border: "1px solid rgba(255,109,52,0.2)",
              }}
            >
              {messages.length} msg{messages.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll px-5 py-5 flex flex-col gap-5">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestion chips — only on first load */}
          {messages.length === 1 && !loading && (
            <div
              className="px-5 pb-3 flex flex-wrap gap-2"
              style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}
            >
              <p className="w-full text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                Try asking:
              </p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition"
                  style={{
                    background: "var(--chat-ai-bg)",
                    border: "1px solid var(--chat-ai-border)",
                    color: "var(--text)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ff6d34";
                    e.currentTarget.style.color = "#ff6d34";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--chat-ai-border)";
                    e.currentTarget.style.color = "var(--text)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask about knowledge, reports, meetings…"
                className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none"
                style={{ color: "var(--text)" }}
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition disabled:opacity-40"
                style={{
                  background:
                    input.trim() && !loading
                      ? "linear-gradient(135deg, #ff6d34, #ff8c5f)"
                      : "var(--border)",
                  color: input.trim() && !loading ? "#fff" : "var(--muted)",
                }}
              >
                <Send size={14} />
              </button>
            </div>
            <p
              className="text-center text-xs mt-2"
              style={{ color: "var(--muted)", opacity: 0.6 }}
            >
              Press Enter to send · AI may make mistakes
            </p>
          </div>
        </div>

        {/* ── Right Sidebar ──────────────────────── */}
        <div className="w-64 hidden lg:flex flex-col gap-4 flex-shrink-0">

          <Card className="p-4">
            <h3
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: "var(--text)" }}
            >
              <Zap size={14} style={{ color: "#f59e0b" }} /> Capabilities
            </h3>
            <ul className="space-y-2.5">
              {CAPABILITIES.map((c) => (
                <li key={c} className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                  <CheckCircle size={12} style={{ color: "#00bea3", flexShrink: 0 }} />
                  {c}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
              Suggested Prompts
            </h3>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="w-full text-left text-xs p-2.5 rounded-lg transition"
                  style={{
                    background: "var(--chat-ai-bg)",
                    border: "1px solid var(--chat-ai-border)",
                    color: "var(--muted)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ff6d34";
                    e.currentTarget.style.color = "#ff6d34";
                    e.currentTarget.style.background = "var(--stat-tint-orange)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--chat-ai-border)";
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.background = "var(--chat-ai-bg)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
              Session Stats
            </h3>
            <div className="space-y-2">
              {[
                { label: "Messages sent", value: userCount },
                { label: "AI replies",    value: aiCount },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--stat-tint-orange)", color: "#ff6d34" }}
                  >
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

export default Meetings;