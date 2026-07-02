// ════════════════════════════════════════════════════════════
//  Custom Error class for typed HTTP errors
// ════════════════════════════════════════════════════════════
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
    this.timestamp = new Date().toISOString();
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

  static ok(data) {
    return { success: true, data };
  }

  static paginated(items, total, page, limit) {
    return { success: true, data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static payloadTooLarge(msg = 'Payload too large') {
    return new ApiError(413, msg);
  }

  static unsupportedMediaType(msg = 'Unsupported media type') {
    return new ApiError(415, msg);
  }

  toJSON() {
    return {
      status: this.status,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export default ApiError;
