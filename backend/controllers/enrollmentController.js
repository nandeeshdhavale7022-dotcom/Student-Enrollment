const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");
const Course = require("../models/Course");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const {
  isValidObjectId,
  parseQueryOptions,
  sendPaginatedResponse
} = require("../utils/queryFeatures");

/**
 * @desc    Enroll a student in a course
 * @route   POST /api/enrollments
 * @access  Public
 */
const createEnrollment = asyncHandler(async (req, res) => {
  const { student, course, grade, status, enrollment_date } = req.body;

  if (!isValidObjectId(student)) {
    throw new ApiError(400, `Invalid student ID format: '${student}'`);
  }

  if (!isValidObjectId(course)) {
    throw new ApiError(400, `Invalid course ID format: '${course}'`);
  }

  // Verify that student exists
  const studentExists = await Student.findById(student);
  if (!studentExists) {
    throw new ApiError(404, `Student with ID '${student}' does not exist`);
  }

  // Verify that course exists
  const courseExists = await Course.findById(course);
  if (!courseExists) {
    throw new ApiError(404, `Course with ID '${course}' does not exist`);
  }

  // Check if student is already enrolled in this course
  const existingEnrollment = await Enrollment.findOne({
    student,
    course
  });
  if (existingEnrollment) {
    throw new ApiError(409, "Student is already enrolled in this course");
  }

  const enrollment = await Enrollment.create({
    student,
    course,
    grade: grade || "Not Graded",
    status: status || "active",
    enrollment_date: enrollment_date || Date.now()
  });

  const populatedEnrollment = await Enrollment.findById(enrollment._id)
    .populate({
      path: "student",
      select: "first_name last_name email"
    })
    .populate({
      path: "course",
      select: "course_code title credits instructor"
    });

  res.status(201).json({
    success: true,
    message: "Student successfully enrolled in course",
    data: populatedEnrollment
  });
});

/**
 * @desc    Get all enrollments with filters, sorting, and pagination
 * @route   GET /api/enrollments
 * @access  Public
 */
const getEnrollments = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, "enrollments");
  const filter = {};

  // Filter by student
  if (req.query.student) {
    if (!isValidObjectId(req.query.student)) {
      throw new ApiError(400, `Invalid student ID format: '${req.query.student}'`);
    }
    filter.student = req.query.student;
  }

  // Filter by course
  if (req.query.course) {
    if (!isValidObjectId(req.query.course)) {
      throw new ApiError(400, `Invalid course ID format: '${req.query.course}'`);
    }
    filter.course = req.query.course;
  }

  // Filter by status
  if (req.query.status) {
    const validStatuses = ["active", "completed", "dropped"];
    if (!validStatuses.includes(req.query.status)) {
      throw new ApiError(
        400,
        `Invalid status. Allowed values: ${validStatuses.join(", ")}`
      );
    }
    filter.status = req.query.status;
  }

  // Filter by grade
  if (req.query.grade) {
    const validGrades = ["A", "B", "C", "D", "F", "Not Graded"];
    if (!validGrades.includes(req.query.grade)) {
      throw new ApiError(
        400,
        `Invalid grade. Allowed values: ${validGrades.join(", ")}`
      );
    }
    filter.grade = req.query.grade;
  }

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate({
        path: "student",
        select: "first_name last_name email"
      })
      .populate({
        path: "course",
        select: "course_code title credits instructor"
      })
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments(filter)
  ]);

  return sendPaginatedResponse(res, {
    data: enrollments,
    total,
    page,
    limit,
    message: "Enrollments retrieved successfully"
  });
});

/**
 * @desc    Get single enrollment by ID
 * @route   GET /api/enrollments/:id
 * @access  Public
 */
const getEnrollmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid enrollment ID format: '${id}'`);
  }

  const enrollment = await Enrollment.findById(id)
    .populate({
      path: "student",
      select: "first_name last_name email enrollment_date"
    })
    .populate({
      path: "course",
      select: "course_code title credits instructor"
    });

  if (!enrollment) {
    throw new ApiError(404, `Enrollment not found with ID '${id}'`);
  }

  res.status(200).json({
    success: true,
    message: "Enrollment details retrieved successfully",
    data: enrollment
  });
});

/**
 * @desc    Update enrollment grade or status
 * @route   PUT /api/enrollments/:id
 * @access  Public
 */
const updateEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid enrollment ID format: '${id}'`);
  }

  const updateFields = {};
  if (req.body.grade !== undefined) updateFields.grade = req.body.grade;
  if (req.body.status !== undefined) updateFields.status = req.body.status;

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "Provide at least 'grade' or 'status' to update");
  }

  const enrollment = await Enrollment.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true, runValidators: true, context: "query" }
  )
    .populate({
      path: "student",
      select: "first_name last_name email"
    })
    .populate({
      path: "course",
      select: "course_code title credits instructor"
    });

  if (!enrollment) {
    throw new ApiError(404, `Enrollment not found with ID '${id}'`);
  }

  res.status(200).json({
    success: true,
    message: "Enrollment updated successfully",
    data: enrollment
  });
});

/**
 * @desc    Drop / Delete an enrollment
 * @route   DELETE /api/enrollments/:id
 * @access  Public
 */
const deleteEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid enrollment ID format: '${id}'`);
  }

  const enrollment = await Enrollment.findByIdAndDelete(id);

  if (!enrollment) {
    throw new ApiError(404, `Enrollment not found with ID '${id}'`);
  }

  res.status(200).json({
    success: true,
    message: "Enrollment deleted successfully"
  });
});

module.exports = {
  createEnrollment,
  getEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment
};
