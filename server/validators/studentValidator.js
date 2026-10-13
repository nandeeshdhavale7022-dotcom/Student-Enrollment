const { body, param } = require("express-validator");

const allowedStudentFields = [
  "first_name",
  "last_name",
  "email",
  "date_of_birth",
  "enrollment_date"
];

const studentIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid student ID format in URL parameter")
];

const createStudentValidation = [
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("date_of_birth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage("Date of birth must be a valid ISO8601 date (e.g. YYYY-MM-DD)")
    .custom(value => {
      const dob = new Date(value);
      if (dob >= new Date()) {
        throw new Error("Date of birth must be in the past");
      }
      return true;
    }),

  body("enrollment_date")
    .optional()
    .isISO8601()
    .withMessage("Enrollment date must be a valid ISO8601 date")
];

const updateStudentValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid student ID format in URL parameter"),

  body("first_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("last_name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("date_of_birth")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid ISO8601 date (e.g. YYYY-MM-DD)")
    .custom(value => {
      const dob = new Date(value);
      if (dob >= new Date()) {
        throw new Error("Date of birth must be in the past");
      }
      return true;
    }),

  body("enrollment_date")
    .optional()
    .isISO8601()
    .withMessage("Enrollment date must be a valid ISO8601 date")
];

module.exports = {
  allowedStudentFields,
  studentIdValidation,
  createStudentValidation,
  updateStudentValidation
};
