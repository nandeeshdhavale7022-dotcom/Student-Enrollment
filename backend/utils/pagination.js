const mongoose = require("mongoose");

const allowedSortFields = {
  students: [
    "first_name",
    "last_name",
    "email",
    "enrollment_date",
    "createdAt"
  ],
  courses: [
    "course_code",
    "title",
    "credits",
    "instructor",
    "createdAt"
  ],
  enrollments: [
    "enrollment_date",
    "grade",
    "status",
    "createdAt"
  ]
};

/**
 * Parse and validate pagination and sorting parameters.
 */
function getQueryOptions(query, resource) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 10 : Number(query.limit);

  if (
    !Number.isSafeInteger(page) ||
    !Number.isSafeInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    const error = new Error(
      "Page must be positive and limit must be between 1 and 100"
    );
    error.statusCode = 400;
    throw error;
  }

  const requestedSort = query.sort || "-createdAt";
  const descending = requestedSort.startsWith("-");
  const field = descending ? requestedSort.slice(1) : requestedSort;

  if (!allowedSortFields[resource].includes(field)) {
    const error = new Error("Invalid sort field");
    error.statusCode = 400;
    throw error;
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort: { [field]: descending ? -1 : 1 }
  };
}

/**
 * Escape user input before using it in a regular expression.
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validate a MongoDB ObjectId.
 */
function isValidObjectId(id) {
  return (
    typeof id === "string" &&
    mongoose.isValidObjectId(id) &&
    new mongoose.Types.ObjectId(id).toString() === id.toLowerCase()
  );
}

/**
 * Send a consistent paginated response.
 */
function sendPaginatedResponse(res, data, total, options) {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      currentPage: options.page,
      totalPages: Math.ceil(total / options.limit),
      limit: options.limit
    }
  });
}

module.exports = {
  getQueryOptions,
  escapeRegex,
  isValidObjectId,
  sendPaginatedResponse
};