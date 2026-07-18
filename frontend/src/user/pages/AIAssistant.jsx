// ══════════════════════════════════════════════
//  USER — pages/AIAssistant.jsx
// ══════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  CheckCircle,
  Copy,
  LoaderCircle,
  Send,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { Card, SectionHeader } from "../../shared/components/UI";
import { EmptyState, ErrorState } from "../../shared/components/AppState";
import { AIAssistantSkeleton } from "../../shared/components/PageSkeletons";
import {
  getAiAssistantBootstrap,
  sendAiChatMessage,
} from "../../shared/services/api/assistantApi";

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
        {[0, 1, 2].map(i => (
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

const MessageBubble = ({ msg }) => {
  const isUser = msg.type === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`flex items-end gap-2 group ${isUser ? "flex-row-reverse" : "flex-row"}`}
      style={{ animation: "chatFadeUp 0.22s ease both" }}
    >
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

      <div
        className={`flex flex-col gap-1 max-w-[min(32rem,78vw)] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <span className="text-xs font-medium px-1" style={{ color: "var(--muted)" }}>
          {isUser ? "You" : "AI Assistant"}
        </span>

        <div
          className={`relative px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
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

          {!isUser ? (
            <button
              onClick={handleCopy}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--muted)",
              }}
              title="Copy message"
              type="button"
            >
              {copied ? <Check size={10} style={{ color: "#00bea3" }} /> : <Copy size={10} />}
            </button>
          ) : null}
        </div>

        {msg.time ? (
          <span className="text-xs px-1" style={{ color: "var(--muted)", opacity: 0.65 }}>
            {msg.time}
          </span>
        ) : null}
      </div>
    </div>
  );
};

const formatTime = date => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const normalizeList = value => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const normalizeTextList = value =>
  normalizeList(value)
    .map(item => {
      if (typeof item === "string") return item;
      return item?.label || item?.title || item?.name || item?.text || "";
    })
    .filter(Boolean);

const normalizeWelcomeMessage = value => {
  if (typeof value === "string") return value;
  if (typeof value?.message === "string") return value.message;
  if (typeof value?.text === "string") return value.text;
  return "Hello! How can I help you today?";
};

const normalizeAssistantReply = response => {
  if (typeof response === "string") return response;
  if (typeof response?.reply === "string") return response.reply;
  if (typeof response?.message === "string") return response.message;
  if (typeof response?.data?.reply === "string") return response.data.reply;
  if (typeof response?.data?.message === "string") return response.data.message;
  return "I could not generate a response right now.";
};

const AIAssistant = () => {
  const [pageState, setPageState] = useState("loading");
  const [pageError, setPageError] = useState("");
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [partialData, setPartialData] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const loadAssistant = async () => {
    setPageState("loading");
    setPageError("");

    try {
      const bootstrap = await getAiAssistantBootstrap();
      const normalizedSuggestions = normalizeTextList(bootstrap.suggestions);
      const normalizedCapabilities = normalizeTextList(bootstrap.capabilities);
      const welcomeMessage = normalizeWelcomeMessage(bootstrap.welcomeMessage);

      setSuggestions(normalizedSuggestions);
      setCapabilities(normalizedCapabilities);
      setPartialData(Boolean(bootstrap.partialData));
      setMessages([
        {
          type: "ai",
          text: welcomeMessage,
          time: formatTime(new Date()),
        },
      ]);
      setPageState("ready");
    } catch (error) {
      setSuggestions([]);
      setCapabilities([]);
      setMessages([]);
      setPartialData(false);
      setPageError(error.message || "Unable to load the AI assistant.");
      setPageState("error");
    }
  };

  useEffect(() => {
    loadAssistant();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, actionError]);

  const userCount = useMemo(
    () => messages.filter(message => message.type === "user").length,
    [messages]
  );
  const aiCount = useMemo(
    () => messages.filter(message => message.type === "ai").length,
    [messages]
  );

  const handleSend = async text => {
    const message = (text ?? input).trim();
    if (!message || isSending) return;

    setInput("");
    setActionError("");
    inputRef.current?.focus();

    setMessages(existing => [
      ...existing,
      { type: "user", text: message, time: formatTime(new Date()) },
    ]);

    setIsSending(true);

    try {
      const response = await sendAiChatMessage(message);
      const reply = normalizeAssistantReply(response);

      setMessages(existing => [
        ...existing,
        { type: "ai", text: reply, time: formatTime(new Date()) },
      ]);
    } catch (error) {
      const failureMessage = error.message || "The assistant could not respond right now.";
      setActionError(failureMessage);
      setMessages(existing => [
        ...existing,
        { type: "ai", text: failureMessage, time: formatTime(new Date()) },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (pageState === "loading") {
    return <AIAssistantSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="AI Assistant"
          subtitle="Ask questions, summarize knowledge, and draft content with the assistant"
        />
        <ErrorState
          title="Could not load AI assistant"
          description={pageError}
          action={
            <button
              onClick={loadAssistant}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
              type="button"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        title="Assistant not ready"
        description="The assistant did not return a usable starting state. Try reloading the page."
        action={
          <button
            onClick={loadAssistant}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "#ff6d34" }}
            type="button"
          >
            Reload Assistant
          </button>
        }
      />
    );
  }

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

      <div className="space-y-6">
        <SectionHeader
          title="AI Assistant"
          subtitle="Ask questions, summarize knowledge, and draft content with the assistant"
        />

        {partialData ? (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <TriangleAlert size={18} style={{ color: "#f59e0b" }} className="mt-0.5" />
              <p className="text-sm" style={{ color: "var(--text)" }}>
                Some assistant bootstrap data is unavailable, but chat is still ready to use.
              </p>
            </div>
          </Card>
        ) : null}

        {actionError ? (
          <Card className="p-4">
            <p className="text-sm font-medium" style={{ color: "#dc2626" }}>
              {actionError}
            </p>
          </Card>
        ) : null}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 min-h-0 lg:h-[calc(100dvh-13rem)]">
          <div
            className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-[min(70dvh,32rem)] lg:min-h-0"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
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

            <div className="flex-1 overflow-y-auto chat-scroll px-5 py-5 flex flex-col gap-5">
              {messages.map((msg, index) => (
                <MessageBubble key={`${msg.type}-${index}-${msg.time || index}`} msg={msg} />
              ))}
              {isSending ? <TypingIndicator /> : null}
              <div ref={bottomRef} />
            </div>

            {messages.length === 1 && suggestions.length > 0 && !isSending ? (
              <div
                className="px-5 pb-3 flex flex-wrap gap-2"
                style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}
              >
                <p className="w-full text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Try asking:
                </p>
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition"
                    style={{
                      background: "var(--chat-ai-bg)",
                      border: "1px solid var(--chat-ai-border)",
                      color: "var(--text)",
                    }}
                    onMouseEnter={event => {
                      event.currentTarget.style.borderColor = "#ff6d34";
                      event.currentTarget.style.color = "#ff6d34";
                    }}
                    onMouseLeave={event => {
                      event.currentTarget.style.borderColor = "var(--chat-ai-border)";
                      event.currentTarget.style.color = "var(--text)";
                    }}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about knowledge, reports, documents, or guidelines..."
                  className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none"
                  style={{ color: "var(--text)" }}
                  disabled={isSending}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isSending || !input.trim()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition disabled:opacity-40"
                  style={{
                    background:
                      input.trim() && !isSending
                        ? "linear-gradient(135deg, #ff6d34, #ff8c5f)"
                        : "var(--border)",
                    color: input.trim() && !isSending ? "#fff" : "var(--muted)",
                  }}
                  type="button"
                >
                  {isSending ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
              <p className="text-center text-xs mt-2" style={{ color: "var(--muted)", opacity: 0.6 }}>
                Press Enter to send · AI may make mistakes
              </p>
            </div>
          </div>

          <div className="w-64 hidden lg:flex flex-col gap-4 flex-shrink-0">
            <Card className="p-4">
              <h3
                className="text-sm font-semibold mb-3 flex items-center gap-2"
                style={{ color: "var(--text)" }}
              >
                <Zap size={14} style={{ color: "#f59e0b" }} /> Capabilities
              </h3>
              {capabilities.length > 0 ? (
                <ul className="space-y-2.5">
                  {capabilities.map(capability => (
                    <li key={capability} className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                      <CheckCircle size={12} style={{ color: "#00bea3", flexShrink: 0 }} />
                      {capability}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Capability data is not available right now.
                </p>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
                Suggested Prompts
              </h3>
              {suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="w-full text-left text-xs p-2.5 rounded-lg transition"
                      style={{
                        background: "var(--chat-ai-bg)",
                        border: "1px solid var(--chat-ai-border)",
                        color: "var(--muted)",
                      }}
                      onMouseEnter={event => {
                        event.currentTarget.style.borderColor = "#ff6d34";
                        event.currentTarget.style.color = "#ff6d34";
                        event.currentTarget.style.background = "var(--stat-tint-orange)";
                      }}
                      onMouseLeave={event => {
                        event.currentTarget.style.borderColor = "var(--chat-ai-border)";
                        event.currentTarget.style.color = "var(--muted)";
                        event.currentTarget.style.background = "var(--chat-ai-bg)";
                      }}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  No prompt suggestions are available right now.
                </p>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
                Session Stats
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Messages sent", value: userCount },
                  { label: "AI replies", value: aiCount },
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
      </div>
    </>
  );
};

export default AIAssistant;


