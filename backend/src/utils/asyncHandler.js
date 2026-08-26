// ════════════════════════════════════════════════════════════
//  Async wrapper — forwards rejected promise errors to next()
// ════════════════════════════════════════════════════════════
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
