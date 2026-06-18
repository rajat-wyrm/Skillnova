// ════════════════════════════════════════════════════════════
//  Request ID middleware — assigns a unique id to every request
//  for log correlation and downstream tracing.
// ════════════════════════════════════════════════════════════
import crypto from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestId() {
  return (req, res, next) => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const id = (typeof incoming === 'string' && incoming.length <= 128 && incoming.length > 0)
      ? incoming
      : crypto.randomBytes(8).toString('hex');
    req.id = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  };
}

export default requestId;