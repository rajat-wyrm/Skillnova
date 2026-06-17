/**
 * SkillNova AI chatbot — vanilla JavaScript SDK.
 *
 * Zero dependencies, works in any browser or Node.js runtime.
 * Stream or one-shot chat, plus bootstrap helpers that match the
 * /api/ai/* endpoint shapes.
 *
 * Usage in the browser:
 *
 *   import { SkillnovaClient } from "./sdk/js/skillnova.js";
 *   const chat = new SkillnovaClient({ baseUrl: "https://api.example.com" });
 *   await chat.bootstrap();   // warms up suggestions + capabilities + welcome
 *
 *   const result = await chat.chat({ message: "How do I submit a task?" });
 *   console.log(result.reply);
 *
 *   // Streaming
 *   for await (const token of chat.stream({ message: "Tell me about reports." })) {
 *     process.stdout.write(token);
 *   }
 */

export class SkillnovaClient {
  /**
   * @param {object} opts
   * @param {string} opts.baseUrl       Base URL with no trailing slash, e.g. https://api.example.com
   * @param {string} [opts.sessionId]   Optional session id; auto-generated if absent
   * @param {string} [opts.role="Intern"]
   * @param {number} [opts.timeoutMs=30000]
   * @param {object} [opts.fetch]       Override the fetch implementation (Node 18+, browser, polyfill)
   * @param {function(string):void} [opts.onError]
   */
  constructor(opts = {}) {
    if (!opts.baseUrl) throw new Error("SkillnovaClient: baseUrl is required");
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.sessionId = opts.sessionId || newSessionId();
    this.role = opts.role || "Intern";
    this.timeoutMs = opts.timeoutMs || 30_000;
    this.fetch = opts.fetch || (typeof fetch !== "undefined" ? fetch : null);
    if (!this.fetch) throw new Error("SkillnovaClient: no fetch implementation available");
    this.onError = opts.onError || ((e) => console.error("[skillnova]", e));
  }

  /** Fetch suggestions + capabilities + welcome message in parallel. */
  async bootstrap() {
    const [suggestions, capabilities, welcome] = await Promise.allSettled([
      this.getSuggestions(),
      this.getCapabilities(),
      this.getWelcomeMessage(),
    ]);
    return {
      suggestions: unwrap(suggestions),
      capabilities: unwrap(capabilities),
      welcomeMessage: unwrap(welcome)?.message || "Hello! How can I help?",
    };
  }

  async getSuggestions() {
    return this._getJson("/api/ai/suggestions");
  }

  async getCapabilities() {
    return this._getJson("/api/ai/capabilities");
  }

  async getWelcomeMessage() {
    return this._getJson("/api/ai/welcome-message");
  }

  async getSession() {
    return this._getJson("/api/session");
  }

  /** One-shot JSON chat. Returns the full ChatResponse payload. */
  async chat({ message, sessionId, role }) {
    const res = await this._postJson("/api/chat", {
      message,
      session_id: sessionId || this.sessionId,
      role: role || this.role,
    });
    if (res.session_id) this.sessionId = res.session_id;
    return res;
  }

  /**
   * Streaming chat. Async iterator that yields tokens. Throws on HTTP
   * errors; surfaces server-side errors via the yielded token with a
   * leading "[skillnova error]" prefix.
   */
  async *stream({ message, sessionId, role }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs * 4);
    try {
      const res = await this.fetch(`${this.baseUrl}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          message,
          session_id: sessionId || this.sessionId,
          role: role || this.role,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      if (!res.body || !res.body.getReader) {
        // Fallback for environments without streaming reader.
        const text = await res.text();
        yield text;
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          try {
            const event = JSON.parse(payload);
            if (event.type === "token" && event.content) yield event.content;
            else if (event.type === "error") throw new Error(event.message || "stream error");
            else if (event.type === "done" && event.session_id) this.sessionId = event.session_id;
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  async sendFeedback({ message, rating, comment, sessionId }) {
    return this._postJson("/api/feedback", {
      session_id: sessionId || this.sessionId,
      message,
      rating,
      comment,
    });
  }

  async health() {
    return this._getJson("/api/health");
  }

  // --- internals ----------------------------------------------------

  async _getJson(path) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const res = await this.fetch(`${this.baseUrl}${path}`, {
        headers: { Accept: "application/json" },
        signal: ctl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} on GET ${path}`);
      return res.json();
    } finally {
      clearTimeout(t);
    }
  }

  async _postJson(path, body) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const res = await this.fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        signal: ctl.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return res.json();
    } finally {
      clearTimeout(t);
    }
  }
}

function newSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function unwrap(settled) {
  if (settled.status === "fulfilled") return settled.value;
  return null;
}

export default SkillnovaClient;