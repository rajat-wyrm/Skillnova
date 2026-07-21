// ════════════════════════════════════════════════════════════
//  Metrics utilities — request body size tracking
// ════════════════════════════════════════════════════════════

const bodySizeBuckets = new Map();

export function bodySizeTracker() {
  return (req, _res, next) => {
    const size = parseInt(req.headers['content-length'], 10) || 0;
    if (size > 0) {
      const route = req.route?.path || req.path;
      const bucket = bodySizeBuckets.get(route) || { count: 0, totalBytes: 0 };
      bucket.count++;
      bucket.totalBytes += size;
      bodySizeBuckets.set(route, bucket);
      req._bodySize = size;
    }
    next();
  };
}

export function getBodySizeStats() {
  const stats = {};
  for (const [route, bucket] of bodySizeBuckets) {
    stats[route] = {
      count: bucket.count,
      totalBytes: bucket.totalBytes,
      avgBytes: Math.round(bucket.totalBytes / bucket.count),
    };
  }
  return stats;
}

export default { bodySizeTracker, getBodySizeStats };
