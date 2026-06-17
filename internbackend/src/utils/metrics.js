"use strict";

/**
 * Tiny Prometheus-compatible metrics endpoint for the Node side.
 *
 * Tracks:
 *   - skillnova_node_http_requests_total{path,method,status}
 *   - skillnova_node_http_request_duration_ms{path,method,quantile}
 *   - skillnova_node_db_pool{field}  (queries, errors, idle/total)
 *   - skillnova_node_uptime_seconds
 *   - skillnova_node_build_info{version}
 *
 * Single-process only (matches the Fastify deployment model).
 */

const VERSION = "1.2.0";

const _httpCount = new Map();
const _httpDuration = new Map();
const _dbStats = { queries: 0, errors: 0 };
const _started = Date.now();

function key(path, method, status) {
  return `${path}|${method}|${status}`;
}

function durationKey(path, method) {
  return `${path}|${method}`;
}

function normalisePath(path) {
  if (!path) return "/";
  // /api/uploads/<uuid> -> /api/uploads/{id}
  if (/^\/api\/uploads\/[^/]+$/.test(path)) return "/api/uploads/{id}";
  // /uploads/<file> -> /uploads/{file}
  if (/^\/uploads\/[^/]+$/.test(path)) return "/uploads/{file}";
  return path;
}

function recordHttp(path, method, status, durationMs) {
  const norm = normalisePath(path);
  const k = key(norm, method, status);
  _httpCount.set(k, (_httpCount.get(k) || 0) + 1);
  const dk = durationKey(norm, method);
  const list = _httpDuration.get(dk) || [];
  list.push(durationMs);
  if (list.length > 500) list.shift();
  _httpDuration.set(dk, list);
}

function recordDb(success) {
  if (success) _dbStats.queries += 1;
  else _dbStats.errors += 1;
}

function percentile(samples, q) {
  if (!samples || !samples.length) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.round(q * (sorted.length - 1))));
  return sorted[idx];
}

function render() {
  const lines = [];
  lines.push("# HELP skillnova_node_build_info Static build information");
  lines.push("# TYPE skillnova_node_build_info gauge");
  lines.push(`skillnova_node_build_info{version="${VERSION}"} 1`);

  lines.push("# HELP skillnova_node_uptime_seconds Process uptime in seconds");
  lines.push("# TYPE skillnova_node_uptime_seconds gauge");
  lines.push(`skillnova_node_uptime_seconds ${((Date.now() - _started) / 1000).toFixed(2)}`);

  lines.push("# HELP skillnova_node_http_requests_total Count of HTTP requests");
  lines.push("# TYPE skillnova_node_http_requests_total counter");
  for (const [k, v] of [..._httpCount.entries()].sort()) {
    const [path, method, status] = k.split("|");
    lines.push(
      `skillnova_node_http_requests_total{path="${path}",method="${method}",status="${status}"} ${v}`,
    );
  }

  lines.append;
  lines.push("# HELP skillnova_node_http_request_duration_ms HTTP request duration in ms");
  lines.push("# TYPE skillnova_node_http_request_duration_ms summary");
  for (const [dk, samples] of [..._httpDuration.entries()].sort()) {
    const [path, method] = dk.split("|");
    for (const q of [0.5, 0.95, 0.99]) {
      lines.push(
        `skillnova_node_http_request_duration_ms{path="${path}",method="${method}",quantile="${q}"} ${percentile(samples, q).toFixed(2)}`,
      );
    }
  }

  lines.push("# HELP skillnova_node_db_queries_total Count of DB queries");
  lines.push("# TYPE skillnova_node_db_queries_total counter");
  lines.push(`skillnova_node_db_queries_total ${_dbStats.queries}`);
  lines.push(`skillnova_node_db_queries_failed_total ${_dbStats.errors}`);

  return lines.join("\n") + "\n";
}

function attach(app) {
  // Hook into every request to record timing + status.
  app.addHook("onResponse", async (req, reply) => {
    recordHttp(req.url || req.routerPath || "/", req.method, reply.statusCode, reply.elapsedTime || 0);
  });

  app.get("/metrics", async (_req, reply) => {
    reply.type("text/plain; version=0.0.4; charset=utf-8");
    return render();
  });
}

module.exports = { attach, recordHttp, recordDb, render, VERSION };