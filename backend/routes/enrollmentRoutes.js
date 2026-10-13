const express = require("express");
const router = express.Router();

const {
  createEnrollment,
  getEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment
} = require("../controllers/enrollmentController");

const { validate, allowFields } = require("../middleware/validate");
const {
  allowedEnrollmentCreateFields,
  allowedEnrollmentUpdateFields,
  enrollmentIdValidation,
  createEnrollmentValidation,
  updateEnrollmentValidation
} = require("../validators/enrollmentValidator");

router
  .route("/")
  .get(getEnrollments)
  .post(
    allowFields(allowedEnrollmentCreateFields),
    createEnrollmentValidation,
    validate,
    createEnrollment
  );

router
  .route("/:id")
  .get(enrollmentIdValidation, validate, getEnrollmentById)
  .put(
    allowFields(allowedEnrollmentUpdateFields),
    updateEnrollmentValidation,
    validate,
    updateEnrollment
  )
  .delete(enrollmentIdValidation, validate, deleteEnrollment);

module.exports = router;
