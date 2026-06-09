// ══════════════════════════════════════════════
//  middleware/errorHandler.js
//  FINAL PRODUCTION ERROR HANDLER
// ══════════════════════════════════════════════

const errorHandler = (err, req, res, next) => {
  let statusCode = err?.statusCode || 500;
  let message = err?.message || "Internal server error";

  // 🔥 HANDLE PRISMA ERRORS
  if (err?.code) {
    switch (err.code) {
      case "P2002":
        statusCode = 400;
        message = "Duplicate field value";
        break;

      case "P2025":
        statusCode = 404;
        message = "Record not found";
        break;

      default:
        statusCode = 500;
        message = "Database error";
    }
  }

  // 🔥 HANDLE JWT ERRORS
  if (err?.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err?.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expired";
  }

  // 🔥 NORMALIZE MESSAGE
  if (typeof message !== "string") {
    message = "Unexpected server error";
  }

  // 🔥 LOGGING (STRUCTURED)
  console.error("[SERVER ERROR]", {
    message,
    original: err?.message,
    path: req?.originalUrl,
    method: req?.method,
    timestamp: new Date().toISOString(),
  });

  // 🔥 RESPONSE
  const response = {
    success: false,
    message,
  };

  // 🔥 DEV ONLY STACK
  if (process.env.NODE_ENV !== "production") {
    response.stack = err?.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;