"use strict";

/**
 * HMAC request signing middleware.
 *
 * External integrations can opt into a second layer of authentication
 * on top of JWT. The client computes
 *
 *     signature = HMAC_SHA256(SECRET, `${method}\n${path}\n${timestamp}\n${sha256(body)}`)
 *
 * and sends it as `X-Signature: t=<ts>,v1=<hex>`. The middleware
 * rejects requests whose signature is missing, expired, or doesn't
 * match the recomputed value.
 *
 * Set `SKILLNOVA_SIGNING_SECRET` to enable; leave unset to disable
 * (the middleware short-circuits to next()).
 *
 * Replay protection: signatures older than `SIGNING_MAX_AGE_S` (default
 * 300s) are rejected. Set SIGNING_ALLOW_FUTURE_S to tolerate small
 * clock skew between the client and the server.
 */

const crypto = require("crypto");

const MAX_AGE_S = parseInt(process.env.SIGNING_MAX_AGE_S || "300", 10);
const ALLOW_FUTURE_S = parseInt(process.env.SIGNING_ALLOW_FUTURE_S || "30", 10);

function timingSafeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function parseHeader(header) {
  if (!header) return null;
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.trim().split("=").map((s) => s.trim())),
  );
  if (!parts.t || !parts.v1) return null;
  const ts = parseInt(parts.t, 10);
  if (!Number.isFinite(ts)) return null;
  return { ts, sig: parts.v1 };
}

async function recompute({ secret, method, url, ts, body }) {
  const bodyHash = crypto.createHash("sha256").update(body || "").digest("hex");
  const payload = `${method.toUpperCase()}\n${url}\n${ts}\n${bodyHash}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function signingMiddleware(req, reply) {
  const secret = process.env.SKILLNOVA_SIGNING_SECRET;
  if (!secret) return; // disabled

  // Only enforce on state-changing methods.
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;

  const header = req.headers["x-signature"];
  const parsed = parseHeader(header);
  if (!parsed) {
    return reply.status(401).send({ error: "Missing or malformed X-Signature" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.ts < now - MAX_AGE_S) {
    return reply.status(401).send({ error: "Signature expired" });
  }
  if (parsed.ts > now + ALLOW_FUTURE_S) {
    return reply.status(401).send({ error: "Signature timestamp in the future" });
  }

  // Collect the body for signing. Fastify already parses JSON but we
  // can re-stringify it to get the exact bytes.
  let body = "";
  if (req.body && Object.keys(req.body).length > 0) {
    try {
      body = JSON.stringify(req.body);
    } catch {
      body = "";
    }
  }

  const expected = await recompute({
    secret,
    method: req.method,
    url: req.url,
    ts: parsed.ts,
    body,
  });

  if (!timingSafeEqual(parsed.sig, expected)) {
    return reply.status(401).send({ error: "Invalid signature" });
  }
}

module.exports = { signingMiddleware, recompute, parseHeader };

// Self-test when invoked directly with `node middleware/signing.js self`.
if (require.main === module && process.argv[2] === "self") {
  (async () => {
    const secret = "test";
    const body = '{"hello":"world"}';
    const ts = Math.floor(Date.now() / 1000);
    const sig = await recompute({ secret, method: "POST", url: "/api/x", ts, body });
    const header = `t=${ts},v1=${sig}`;
    const parsed = parseHeader(header);
    console.log("parsed:", parsed);
    const expected = await recompute({
      secret,
      method: "POST",
      url: "/api/x",
      ts: parsed.ts,
      body,
    });
    console.log("match:", timingSafeEqual(parsed.sig, expected));
  })();
}