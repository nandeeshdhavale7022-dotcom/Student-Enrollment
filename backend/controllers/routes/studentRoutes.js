const express = require("express");
const { body, param } = require("express-validator");

const controller = require("../controllers/studentController");
const { validate, allowFields } = require("../middleware/validate");

const router = express.Router();

const fields = [
  "first_name",
  "last_name",
  "email",
  "date_of_birth",
  "enrollment_date"
];

// Required on POST, optional on PUT.
function studentRules(isUpdate = false) {
  const required = isUpdate ? body => body.optional() : body => body;

  return [
    required(body("first_name"))
      .trim().notEmpty().withMessage("First name is required")
      .isLength({ max: 50 }),

    required(body("last_name"))
      .trim().notEmpty().withMessage("Last name is required")
      .isLength({ max: 50 }),

    required(body("email"))
      .trim().isEmail().withMessage("Enter a valid email")
      .normalizeEmail(),

    required(body("date_of_birth"))
      .isISO8601({ strict: true })
      .withMessage("Use a valid YYYY-MM-DD date")
      .custom(value => {
        const date = new Date(value);

        if (date > new Date()) {
          throw new Error("Date of birth cannot be in the future");
        }

        return true;
      }),

    body("enrollment_date")
      .optional()
      .isISO8601()
      .withMessage("Invalid enrollment date")
  ];
}

router.post(
  "/",
  allowFields(fields),
  studentRules(),
  validate,
  controller.createStudent
);

router.get("/", controller.getStudents);

router.get(
  "/:id",
  param("id").isMongoId().withMessage("Invalid student ID"),
  validate,
  controller.getStudentById
);

router.put(
  "/:id",
  allowFields(fields),
  param("id").isMongoId().withMessage("Invalid student ID"),
  ...studentRules(true),
  validate,
  controller.updateStudent
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("Invalid student ID"),
  validate,
  controller.deleteStudent
);

module.exports = router;