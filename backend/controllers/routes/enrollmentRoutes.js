const express = require("express");
const { body, param } = require("express-validator");

const controller = require("../controllers/enrollmentController");
const { validate, allowFields } = require("../middleware/validate");

const router = express.Router();

const fields = ["student", "course", "grade", "status"];

router.post(
  "/",
  allowFields(fields),

  body("student")
    .isMongoId()
    .withMessage("Valid student ID is required"),

  body("course")
    .isMongoId()
    .withMessage("Valid course ID is required"),

  body("grade")
    .optional()
    .isIn(["A", "B", "C", "D", "F", "Not Graded"])
    .withMessage("Invalid grade"),

  body("status")
    .optional()
    .isIn(["active", "completed"])
    .withMessage("Status must be active or completed"),

  validate,
  controller.createEnrollment
);

router.get("/", controller.getEnrollments);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("Invalid enrollment ID"),
  validate,
  controller.deleteEnrollment
);

module.exports = router;