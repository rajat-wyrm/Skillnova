// ════════════════════════════════════════════════════════════
//  Custom Error class for typed HTTP errors
// ════════════════════════════════════════════════════════════
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflict') {
    return new ApiError(409, msg);
  }
  static rateLimit(msg = 'Too many requests') {
    return new ApiError(429, msg);
  }
  static serviceUnavailable(msg = 'Service unavailable') {
    return new ApiError(503, msg);
  }
  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg);
  }
}

export default ApiError;
