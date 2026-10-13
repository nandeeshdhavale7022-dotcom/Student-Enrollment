const express = require("express");
const router = express.Router();

const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} = require("../controllers/courseController");

const { validate, allowFields } = require("../middleware/validate");
const {
  allowedCourseFields,
  courseIdValidation,
  createCourseValidation,
  updateCourseValidation
} = require("../validators/courseValidator");

router
  .route("/")
  .get(getCourses)
  .post(
    allowFields(allowedCourseFields),
    createCourseValidation,
    validate,
    createCourse
  );

router
  .route("/:id")
  .get(courseIdValidation, validate, getCourseById)
  .put(
    allowFields(allowedCourseFields),
    updateCourseValidation,
    validate,
    updateCourse
  )
  .delete(courseIdValidation, validate, deleteCourse);

module.exports = router;
