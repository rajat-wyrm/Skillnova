// ══════════════════════════════════════════════
//  utils/http.js
//  Production-safe response + async handler
// ══════════════════════════════════════════════

// SUCCESS RESPONSE
export const sendSuccess = (
  res,
  data = {},
  message = "Success",
  status = 200
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

// ERROR RESPONSE
export const sendError = (
  res,
  message = "Something went wrong",
  status = 500,
  errors = null
) => {
  const response = {
    success: false,
    message,
  };

  if (errors && typeof errors === "object") {
    response.errors = errors;
  }

  return res.status(status).json(response);
};

// ASYNC HANDLER
export const asyncHandler = (fn) => {
  if (typeof fn !== "function") {
    throw new TypeError("asyncHandler expects a function");
  }

  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      next(err);
    });
  };
};