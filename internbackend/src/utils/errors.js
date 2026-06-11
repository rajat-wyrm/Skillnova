class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}
class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}
module.exports = { AppError, UnauthorizedError, BadRequestError };
