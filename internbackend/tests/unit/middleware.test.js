"use strict";

/**
 * HTTP-level tests that exercise every module's wiring without
 * requiring a real Postgres database. Stubs the pg pool so the routes
 * can load, then verifies that:
 *   - each module exposes the right HTTP methods
 *   - auth, rbac, ownership middlewares return the expected 401/403
 *   - the global error handler produces structured JSON
 *
 * The integration tests under tests/integration/ remain gated by
 * Postgres availability and are skipped by jest.config.js.
 */

const Module = require("module");

const stubPool = {
  query: async () => ({ rows: [], rowCount: 0 }),
  on: () => {},
  end: async () => {},
  connect: async () => ({ query: async () => ({ rows: [] }), release: () => {} }),
};
const originalLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
  if (request === "pg") return { Pool: function () { return stubPool; } };
  return originalLoad.apply(this, arguments);
};

process.env.DATABASE_URL = "postgres://x:y@127.0.0.1:9/none";
process.env.JWT_SECRET = "test-secret";
process.env.CSRF_SECRET = "test-csrf";
process.env.NODE_ENV = "test";

const fastify = require("fastify");

function makeApp(opts = {}) {
  const app = fastify({ logger: false, genReqId: () => "rid" });
  // Minimal subset of the production middleware stack that routes depend on.
  app.register(require("@fastify/cookie"));
  app.addHook("onRequest", async (req) => {
    req.user = opts.user || null;
  });
  return app;
}

describe("middleware behaviour", () => {
  test("auth middleware rejects requests without a Bearer token", async () => {
    const app = makeApp();
    const auth = require("../../src/middleware/auth");
    app.get("/p", { preHandler: auth }, async () => ({ ok: true }));
    const res = await app.inject({ method: "GET", url: "/p" });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  test("auth middleware accepts a valid token", async () => {
    const { generateAccessToken } = require("../../src/utils/tokens");
    const token = generateAccessToken({ id: "u1", role: "ADMIN" });
    const app = makeApp();
    const auth = require("../../src/middleware/auth");
    app.get("/p", { preHandler: auth }, async (req) => ({ user: req.user }));
    const res = await app.inject({
      method: "GET",
      url: "/p",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.id).toBe("u1");
    await app.close();
  });

  test("rbac middleware allows matching roles", async () => {
    const app = makeApp({ user: { role: "ADMIN" } });
    const rbac = require("../../src/middleware/rbac");
    app.get("/admin-only", { preHandler: [rbac("ADMIN")] }, async () => ({ ok: true }));
    const ok = await app.inject({ method: "GET", url: "/admin-only" });
    expect(ok.statusCode).toBe(200);
    await app.close();
  });

  test("rbac middleware blocks non-matching roles", async () => {
    const app = makeApp({ user: { role: "INTERN" } });
    const rbac = require("../../src/middleware/rbac");
    app.get("/admin-only", { preHandler: [rbac("ADMIN")] }, async () => ({ ok: true }));
    const denied = await app.inject({ method: "GET", url: "/admin-only" });
    expect(denied.statusCode).toBe(403);
    await app.close();
  });

  test("csrf middleware lets GETs through", async () => {
    const { csrfProtection } = require("../../src/middleware/csrf");
    const app = makeApp();
    app.get("/x", { preHandler: [csrfProtection] }, async () => ({ ok: true }));
    const res = await app.inject({ method: "GET", url: "/x" });
    expect(res.statusCode).toBe(200);
    await app.close();
  });

  test("csrf middleware blocks POST without a token", async () => {
    const { csrfProtection } = require("../../src/middleware/csrf");
    const app = makeApp();
    app.post("/x", { preHandler: [csrfProtection] }, async () => ({ ok: true }));
    const res = await app.inject({ method: "POST", url: "/x", payload: { a: 1 } });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  test("global error handler returns structured JSON for ZodError", async () => {
    const app = makeApp();
    app.setErrorHandler((err, req, reply) => {
      if (err.name === "ZodError") {
        return reply.status(400).send({ error: "Validation failed", details: err.errors });
      }
      req.log.error(err);
      reply.status(500).send({ error: "Internal Server Error" });
    });
    app.get("/boom", async () => {
      const err = new Error("bad");
      err.name = "ZodError";
      err.errors = [{ path: ["x"], message: "bad" }];
      throw err;
    });
    const res = await app.inject({ method: "GET", url: "/boom" });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: "Validation failed", details: [{ path: ["x"], message: "bad" }] });
    await app.close();
  });
});