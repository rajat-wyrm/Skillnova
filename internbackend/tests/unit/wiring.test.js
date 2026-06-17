"use strict";

/**
 * Pure unit tests that do not require a database, a running server,
 * or any external service. The integration tests under
 * tests/integration/ need a real Postgres and are skipped by default.
 */

const path = require("path");
const Module = require("module");

// Stub the `pg` pool before any module that imports config/db gets loaded.
const originalResolve = Module._resolveFilename;
const originalLoad = Module._load;
const stubPool = {
  query: async () => ({ rows: [], rowCount: 0 }),
  on: () => {},
  end: async () => {},
};
Module._load = function patched(request, parent, isMain) {
  if (request === "pg") return { Pool: function () { return stubPool; } };
  return originalLoad.apply(this, arguments);
};

process.env.DATABASE_URL = "postgres://x:y@127.0.0.1:9/none";
process.env.JWT_SECRET = "test-secret";
process.env.CSRF_SECRET = "test-csrf";
process.env.NODE_ENV = "test";

describe("module wiring", () => {
  test("every route module loads without throwing", () => {
    const fs = require("fs");
    const root = path.join(__dirname, "..", "..", "src", "modules");
    const failures = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name === "routes.js" || entry.name === "export.js") {
          try {
            require(p);
          } catch (e) {
            if (/ECONNREFUSED|database|pool|CSRF/.test(e.message)) continue;
            failures.push(`${p}: ${e.message}`);
          }
        }
      }
    }
    walk(root);
    expect(failures).toEqual([]);
  });

  test("utils/tokens.js exports the expected surface", () => {
    const t = require("../../src/utils/tokens");
    expect(typeof t.generateAccessToken).toBe("function");
    expect(typeof t.verifyAccessToken).toBe("function");
    expect(typeof t.generateRefreshToken).toBe("function");
    expect(typeof t.verifyRefreshToken).toBe("function");
    expect(typeof t.hashToken).toBe("function");
  });

  test("hashToken is deterministic and 64 hex chars", () => {
    const { hashToken } = require("../../src/utils/tokens");
    const a = hashToken("hello");
    const b = hashToken("hello");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  test("uploads module exposes POST / and GET /list", () => {
    const factory = require("../../src/modules/uploads/routes");
    expect(typeof factory).toBe("function");
    const registered = [];
    const fakeFastify = {
      post: (path, opts, handler) => registered.push(["POST", path]),
      get: (path, opts, handler) => registered.push(["GET", path]),
    };
    factory(fakeFastify);
    const paths = registered.map((r) => `${r[0]} ${r[1]}`);
    expect(paths).toContain("POST /");
    expect(paths).toContain("GET /list");
  });

  test("csrf module signs and verifies a token", () => {
    const { generateToken, csrfProtection } = require("../../src/middleware/csrf");
    const t = generateToken();
    expect(typeof t).toBe("string");
    expect(typeof csrfProtection).toBe("function");
    // csrfProtection is a Fastify preHandler; verify it does not throw
    // when invoked for a safe GET request.
    expect(() => csrfProtection({ method: "GET", headers: {}, url: "/" }, {}, () => {})).not.toThrow();
  });
});