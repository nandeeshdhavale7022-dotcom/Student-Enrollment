/**
 * Wrapper for async route handlers to eliminate repetitive try/catch blocks.
 * Forwards any rejected promises to Express error handling middleware.
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
