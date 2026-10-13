const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const {
  escapeRegex,
  isValidObjectId,
  parseQueryOptions,
  sendPaginatedResponse
} = require("../utils/queryFeatures");

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Public
 */
const createCourse = asyncHandler(async (req, res) => {
  const { course_code, title, description, credits, instructor } = req.body;

  const existingCourse = await Course.findOne({
    course_code: course_code.toUpperCase().trim()
  });
  if (existingCourse) {
    throw new ApiError(409, "A course with this course code already exists");
  }

  const course = await Course.create({
    course_code: course_code.toUpperCase().trim(),
    title: title.trim(),
    description: description ? description.trim() : "",
    credits: Number(credits),
    instructor: instructor.trim()
  });

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    data: course
  });
});

/**
 * @desc    Get all courses with search, filtering, sorting, and pagination
 * @route   GET /api/courses
 * @access  Public
 */
const getCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, "courses");
  const filter = {};

  // Search across course_code, title, and instructor
  if (req.query.search && typeof req.query.search === "string") {
    const searchTrimmed = req.query.search.trim();
    if (searchTrimmed) {
      const searchRegex = new RegExp(escapeRegex(searchTrimmed), "i");
      filter.$or = [
        { course_code: searchRegex },
        { title: searchRegex },
        { instructor: searchRegex }
      ];
    }
  }

  // Filter by credits
  if (req.query.credits !== undefined && req.query.credits !== "") {
    const creditsNum = parseInt(req.query.credits, 10);
    if (!isNaN(creditsNum)) {
      filter.credits = creditsNum;
    }
  }

  // Filter by instructor
  if (req.query.instructor && typeof req.query.instructor === "string") {
    const instructorTrimmed = req.query.instructor.trim();
    if (instructorTrimmed) {
      filter.instructor = new RegExp(escapeRegex(instructorTrimmed), "i");
    }
  }

  const [courses, total] = await Promise.all([
    Course.find(filter).sort(sort).skip(skip).limit(limit),
    Course.countDocuments(filter)
  ]);

  return sendPaginatedResponse(res, {
    data: courses,
    total,
    page,
    limit,
    message: "Courses retrieved successfully"
  });
});

/**
 * @desc    Get single course by ID including enrolled students
 * @route   GET /api/courses/:id
 * @access  Public
 */
const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid course ID format: '${id}'`);
  }

  const course = await Course.findById(id);
  if (!course) {
    throw new ApiError(404, `Course not found with ID '${id}'`);
  }

  // Populate enrollments with student information
  const enrollments = await Enrollment.find({ course: course._id }).populate({
    path: "student",
    select: "first_name last_name email enrollment_date"
  });

  const courseData = course.toObject();
  courseData.enrollments = enrollments;

  res.status(200).json({
    success: true,
    message: "Course details retrieved successfully",
    data: courseData
  });
});

/**
 * @desc    Update course details
 * @route   PUT /api/courses/:id
 * @access  Public
 */
const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid course ID format: '${id}'`);
  }

  // If course_code is being modified, ensure uniqueness
  if (req.body.course_code) {
    const codeConflict = await Course.findOne({
      course_code: req.body.course_code.toUpperCase().trim(),
      _id: { $ne: id }
    });
    if (codeConflict) {
      throw new ApiError(409, "A course with this course code already exists");
    }
    req.body.course_code = req.body.course_code.toUpperCase().trim();
  }

  const course = await Course.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true, context: "query" }
  );

  if (!course) {
    throw new ApiError(404, `Course not found with ID '${id}'`);
  }

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    data: course
  });
});

/**
 * @desc    Delete a course and associated enrollments
 * @route   DELETE /api/courses/:id
 * @access  Public
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid course ID format: '${id}'`);
  }

  const course = await Course.findById(id);
  if (!course) {
    throw new ApiError(404, `Course not found with ID '${id}'`);
  }

  const deletedEnrollments = await Enrollment.deleteMany({ course: course._id });
  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: "Course and associated enrollments deleted successfully",
    deletedEnrollmentCount: deletedEnrollments.deletedCount
  });
});

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};
