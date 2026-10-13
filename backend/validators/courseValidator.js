const { body, param } = require("express-validator");

const allowedCourseFields = [
  "course_code",
  "title",
  "description",
  "credits",
  "instructor"
];

const courseIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid course ID format in URL parameter")
];

const createCourseValidation = [
  body("course_code")
    .trim()
    .notEmpty()
    .withMessage("Course code is required")
    .isLength({ min: 2, max: 30 })
    .withMessage("Course code must be between 2 and 30 characters"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Course title is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Course title must be between 2 and 150 characters"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("credits")
    .notEmpty()
    .withMessage("Credits are required")
    .isInt({ min: 1, max: 30 })
    .withMessage("Credits must be an integer between 1 and 30"),

  body("instructor")
    .trim()
    .notEmpty()
    .withMessage("Instructor is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Instructor name must be between 2 and 100 characters")
];

const updateCourseValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid course ID format in URL parameter"),

  body("course_code")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Course code must be between 2 and 30 characters"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Course title must be between 2 and 150 characters"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("credits")
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage("Credits must be an integer between 1 and 30"),

  body("instructor")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Instructor name must be between 2 and 100 characters")
];

module.exports = {
  allowedCourseFields,
  courseIdValidation,
  createCourseValidation,
  updateCourseValidation
};
