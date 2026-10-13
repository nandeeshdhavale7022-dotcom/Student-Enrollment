/**
 * Middleware for handling routes that are not matched.
 */
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

/**
 * Global centralized error handler.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors || [];

  // Handle Body Parser JSON SyntaxError
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload in request body"
    });
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ID format for path '${err.path}'`;
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Database schema validation failed";
    errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
  }

  // MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const fields = Object.keys(err.keyPattern || {});

    if (fields.includes("email")) {
      message = "A student with this email address already exists";
    } else if (fields.includes("course_code")) {
      message = "A course with this course code already exists";
    } else if (fields.includes("student") && fields.includes("course")) {
      message = "Student is already enrolled in this course";
    } else {
      message = `Duplicate value error for field(s): ${fields.join(", ")}`;
    }
  }

  // Prevent leaking internal error stack in production
  if (process.env.NODE_ENV !== "development" && statusCode === 500) {
    console.error(`[Server Error] ${err.stack || err}`);
    message = "An unexpected server error occurred";
  } else if (statusCode === 500) {
    console.error(`[Server Error] ${err.stack || err}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === "development" && statusCode === 500 && { stack: err.stack })
  });
}

module.exports = {
  notFound,
  errorHandler
};
