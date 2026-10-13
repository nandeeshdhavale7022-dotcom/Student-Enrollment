const Student = require("../models/Student");
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
 * @desc    Create a new student
 * @route   POST /api/students
 * @access  Public
 */
const createStudent = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, date_of_birth, enrollment_date } = req.body;

  // Check if student with email already exists
  const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
  if (existingStudent) {
    throw new ApiError(409, "A student with this email address already exists");
  }

  const student = await Student.create({
    first_name,
    last_name,
    email,
    date_of_birth,
    enrollment_date: enrollment_date || Date.now()
  });

  res.status(201).json({
    success: true,
    message: "Student created successfully",
    data: student
  });
});

/**
 * @desc    Get all students with search, sorting, and pagination
 * @route   GET /api/students
 * @access  Public
 */
const getStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, "students");
  const filter = {};

  // Search filter across first_name, last_name, and email
  if (req.query.search && typeof req.query.search === "string") {
    const searchTrimmed = req.query.search.trim();
    if (searchTrimmed) {
      const searchRegex = new RegExp(escapeRegex(searchTrimmed), "i");
      filter.$or = [
        { first_name: searchRegex },
        { last_name: searchRegex },
        { email: searchRegex }
      ];
    }
  }

  const [students, total] = await Promise.all([
    Student.find(filter).sort(sort).skip(skip).limit(limit),
    Student.countDocuments(filter)
  ]);

  return sendPaginatedResponse(res, {
    data: students,
    total,
    page,
    limit,
    message: "Students retrieved successfully"
  });
});

/**
 * @desc    Get single student by ID including their enrolled courses
 * @route   GET /api/students/:id
 * @access  Public
 */
const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid student ID format: '${id}'`);
  }

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError(404, `Student not found with ID '${id}'`);
  }

  // Populate student's enrollments with course details
  const enrollments = await Enrollment.find({ student: student._id }).populate({
    path: "course",
    select: "course_code title credits instructor"
  });

  const studentData = student.toObject();
  studentData.enrollments = enrollments;

  res.status(200).json({
    success: true,
    message: "Student details retrieved successfully",
    data: studentData
  });
});

/**
 * @desc    Update an existing student
 * @route   PUT /api/students/:id
 * @access  Public
 */
const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid student ID format: '${id}'`);
  }

  // If email is provided, verify no other student has it
  if (req.body.email) {
    const emailConflict = await Student.findOne({
      email: req.body.email.toLowerCase().trim(),
      _id: { $ne: id }
    });
    if (emailConflict) {
      throw new ApiError(409, "A student with this email address already exists");
    }
  }

  const student = await Student.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true, context: "query" }
  );

  if (!student) {
    throw new ApiError(404, `Student not found with ID '${id}'`);
  }

  res.status(200).json({
    success: true,
    message: "Student updated successfully",
    data: student
  });
});

/**
 * @desc    Delete a student and cascade delete associated enrollments
 * @route   DELETE /api/students/:id
 * @access  Public
 */
const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid student ID format: '${id}'`);
  }

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError(404, `Student not found with ID '${id}'`);
  }

  // Cascade delete enrollments associated with this student
  const deletedEnrollments = await Enrollment.deleteMany({ student: student._id });
  await student.deleteOne();

  res.status(200).json({
    success: true,
    message: "Student and associated enrollments deleted successfully",
    deletedEnrollmentCount: deletedEnrollments.deletedCount
  });
});

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};
