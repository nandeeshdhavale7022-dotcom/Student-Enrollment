const express = require("express");
const router = express.Router();

const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} = require("../controllers/studentController");

const { validate, allowFields } = require("../middleware/validate");
const {
  allowedStudentFields,
  studentIdValidation,
  createStudentValidation,
  updateStudentValidation
} = require("../validators/studentValidator");

router
  .route("/")
  .get(getStudents)
  .post(
    allowFields(allowedStudentFields),
    createStudentValidation,
    validate,
    createStudent
  );

router
  .route("/:id")
  .get(studentIdValidation, validate, getStudentById)
  .put(
    allowFields(allowedStudentFields),
    updateStudentValidation,
    validate,
    updateStudent
  )
  .delete(studentIdValidation, validate, deleteStudent);

module.exports = router;
