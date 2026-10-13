const { body, param } = require("express-validator");

const allowedEnrollmentCreateFields = [
  "student",
  "course",
  "grade",
  "status",
  "enrollment_date"
];

const allowedEnrollmentUpdateFields = [
  "grade",
  "status"
];

const enrollmentIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid enrollment ID format in URL parameter")
];

const createEnrollmentValidation = [
  body("student")
    .notEmpty()
    .withMessage("Student ID is required")
    .isMongoId()
    .withMessage("Student ID must be a valid MongoDB ObjectId"),

  body("course")
    .notEmpty()
    .withMessage("Course ID is required")
    .isMongoId()
    .withMessage("Course ID must be a valid MongoDB ObjectId"),

  body("grade")
    .optional()
    .isIn(["A", "B", "C", "D", "F", "Not Graded"])
    .withMessage("Grade must be one of: A, B, C, D, F, Not Graded"),

  body("status")
    .optional()
    .isIn(["active", "completed", "dropped"])
    .withMessage("Status must be one of: active, completed, dropped"),

  body("enrollment_date")
    .optional()
    .isISO8601()
    .withMessage("Enrollment date must be a valid ISO8601 date")
];

const updateEnrollmentValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid enrollment ID format in URL parameter"),

  body("grade")
    .optional()
    .isIn(["A", "B", "C", "D", "F", "Not Graded"])
    .withMessage("Grade must be one of: A, B, C, D, F, Not Graded"),

  body("status")
    .optional()
    .isIn(["active", "completed", "dropped"])
    .withMessage("Status must be one of: active, completed, dropped")
];

module.exports = {
  allowedEnrollmentCreateFields,
  allowedEnrollmentUpdateFields,
  enrollmentIdValidation,
  createEnrollmentValidation,
  updateEnrollmentValidation
};
