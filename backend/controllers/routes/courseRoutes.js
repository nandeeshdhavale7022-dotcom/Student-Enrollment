const express = require("express");
const { body, param } = require("express-validator");

const controller = require("../controllers/courseController");
const { validate, allowFields } = require("../middleware/validate");

const router = express.Router();

const fields = [
  "course_code",
  "title",
  "description",
  "credits",
  "instructor"
];

function courseRules(isUpdate = false) {
  const required = isUpdate ? rule => rule.optional() : rule => rule;

  return [
    required(body("course_code"))
      .trim().notEmpty().withMessage("Course code is required")
      .isLength({ max: 30 }),

    required(body("title"))
      .trim().notEmpty().withMessage("Title is required")
      .isLength({ max: 150 }),

    body("description")
      .optional()
      .isString().withMessage("Description must be a string"),

    required(body("credits"))
      .isInt({ min: 1, max: 30 })
      .withMessage("Credits must be an integer from 1 to 30")
      .toInt(),

    required(body("instructor"))
      .trim().notEmpty().withMessage("Instructor is required")
      .isLength({ max: 100 })
  ];
}

router.post(
  "/",
  allowFields(fields),
  courseRules(),
  validate,
  controller.createCourse
);

router.get("/", controller.getCourses);

router.get(
  "/:id",
  param("id").isMongoId().withMessage("Invalid course ID"),
  validate,
  controller.getCourseById
);

router.put(
  "/:id",
  allowFields(fields),
  param("id").isMongoId().withMessage("Invalid course ID"),
  ...courseRules(true),
  validate,
  controller.updateCourse
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("Invalid course ID"),
  validate,
  controller.deleteCourse
);

module.exports = router;