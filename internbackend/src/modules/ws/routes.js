"use strict";

/**
 * Real-time chat WebSocket for the SkillNova AI chatbot.
 *
 * Wires Fastify's @fastify/websocket plugin into the existing service
 * surface so any client (the React frontend, the widget, external
 * integrations) can stream tokens over a single persistent connection.
 *
 * Protocol (JSON over WS):
 *   client -> { type: "chat", message, session_id?, role? }
 *   server -> { type: "ready", session_id }
 *   server -> { type: "token", content }
 *   server -> { type: "done", session_id, confidence, sources, escalated }
 *   server -> { type: "error", message }
 *   client -> { type: "ping" }
 *   server -> { type: "pong" }
 */

const auth = require("../../middleware/auth");
const db = require("../../config/db");

const CHAT_HISTORY_SQL = `
  SELECT turn_number, user_message, bot_response, created_at
  FROM chat_history
  WHERE session_id = $1
  ORDER BY turn_number DESC
  LIMIT 10
`;

const INSERT_TURN_SQL = `
  INSERT INTO chat_history (session_id, turn_number, user_message, bot_response, created_at)
  VALUES ($1, $2, $3, $4, NOW())
  ON CONFLICT (session_id, turn_number) DO NOTHING
`;

const SESSION_ID_RE = /^[a-zA-Z0-9-]{8,128}$/;

async function routes(fastify) {
  fastify.get(
    "/ws/chat",
    { websocket: true, preHandler: [auth] },
    async (socket, req) => {
      const sessionId =
        (req.query && req.query.session_id) ||
        `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

      await socket.send(
        JSON.stringify({ type: "ready", session_id: sessionId }),
      );

      socket.on("message", async (raw) => {
        let payload;
        try {
          payload = JSON.parse(raw.toString());
        } catch {
          await socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
          return;
        }

        if (payload.type === "ping") {
          await socket.send(JSON.stringify({ type: "pong" }));
          return;
        }

        if (payload.type !== "chat") {
          await socket.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
          return;
        }

        const message = (payload.message || "").trim();
        if (!message) {
          await socket.send(JSON.stringify({ type: "error", message: "Empty message" }));
          return;
        }
        if (message.length > 2000) {
          await socket.send(JSON.stringify({ type: "error", message: "Message too long" }));
          return;
        }

        // For the demo backend the chat pipeline lives in the Python
        // service. This route is a thin bridge that forwards the message
        // over HTTP and streams tokens back through the WS.
        const upstream = `${process.env.PYTHON_CHAT_URL || "http://127.0.0.1:5000"}/api/chat/stream`;
        let turn;
        try {
          const client = require("http");
          const parsed = new URL(upstream);
          const body = JSON.stringify({
            message,
            session_id: payload.session_id || sessionId,
            role: payload.role || "Intern",
          });
          const headers = {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          };

          const upstreamRes = await new Promise((resolve, reject) => {
            const r = client.request(
              {
                host: parsed.hostname,
                port: parsed.port || 80,
                path: parsed.pathname + (parsed.search || ""),
                method: "POST",
                headers,
              },
              (res) => resolve(res),
            );
            r.on("error", reject);
            r.write(body);
            r.end();
          });

          upstreamRes.setEncoding("utf8");
          let buf = "";
          let fullText = "";
          for await (const chunk of upstreamRes) {
            buf += chunk;
            const lines = buf.split("\n");
            buf = lines.pop() || "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data) continue;
              try {
                const event = JSON.parse(data);
                if (event.type === "token" && event.content) {
                  fullText += event.content;
                  await socket.send(
                    JSON.stringify({ type: "token", content: event.content }),
                  );
                } else if (event.type === "done") {
                  await socket.send(
                    JSON.stringify({
                      type: "done",
                      session_id: event.session_id || sessionId,
                      confidence: event.confidence || 0,
                      sources: event.sources || [],
                      escalated: !!event.escalated,
                    }),
                  );
                }
              } catch {
                /* ignore malformed line */
              }
            }
          }

          // Persist the turn if we managed to collect a reply.
          if (fullText) {
            try {
              const countRes = await db.query(
                "SELECT COALESCE(MAX(turn_number), 0) AS max_turn FROM chat_history WHERE session_id = $1",
                [sessionId],
              );
              turn = (countRes.rows[0].max_turn || 0) + 1;
              await db.query(INSERT_TURN_SQL, [sessionId, turn, message, fullText]);
            } catch (e) {
              req.log.warn({ err: e.message }, "failed to persist ws chat turn");
            }
          }
        } catch (err) {
          req.log.error({ err: err.message }, "ws chat upstream error");
          try {
            await socket.send(
              JSON.stringify({ type: "error", message: "Chat backend unreachable" }),
            );
          } catch {
            /* socket may be closed */
          }
        }
      });

      socket.on("close", () => {
        // Best-effort cleanup; nothing to do for an in-memory socket.
      });
    },
  );
}

module.exports = routes;