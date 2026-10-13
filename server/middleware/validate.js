const { validationResult } = require("express-validator");

/**
 * Middleware that inspects validation results from express-validator rules.
 * If any validation errors exist, returns a structured 400 response.
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || (err.param ? err.param : "unknown"),
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors
    });
  }

  next();
}

/**
 * Middleware to reject unexpected request body keys if desired.
 */
function allowFields(allowedFields) {
  return (req, res, next) => {
    if (req.body && typeof req.body === "object") {
      const bodyKeys = Object.keys(req.body);
      const unknownKeys = bodyKeys.filter(key => !allowedFields.includes(key));

      if (unknownKeys.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Unrecognized field(s) in payload: ${unknownKeys.join(", ")}`
        });
      }

      if (req.method === "PUT" && bodyKeys.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request body cannot be empty for an update"
        });
      }
    }

    next();
  };
}

module.exports = {
  validate,
  allowFields
};
