const mongoose = require("mongoose");
const ApiError = require("./apiError");

const allowedSortFields = {
  students: [
    "first_name",
    "last_name",
    "email",
    "date_of_birth",
    "enrollment_date",
    "createdAt",
    "updatedAt"
  ],
  courses: [
    "course_code",
    "title",
    "credits",
    "instructor",
    "createdAt",
    "updatedAt"
  ],
  enrollments: [
    "enrollment_date",
    "grade",
    "status",
    "createdAt",
    "updatedAt"
  ]
};

/**
 * Escapes characters with special meaning in regex.
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Validates whether the given string is a valid MongoDB ObjectId.
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

/**
 * Parses and validates query options for pagination and sorting.
 */
function parseQueryOptions(query, resource) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = 10;
  } else if (limit > 100) {
    limit = 100;
  }

  const skip = (page - 1) * limit;

  // Sorting
  let sortOption = { createdAt: -1 };
  if (query.sort) {
    const rawSort = String(query.sort).trim();
    const isDescending = rawSort.startsWith("-");
    const field = isDescending ? rawSort.substring(1) : rawSort;

    const resourceAllowed = allowedSortFields[resource] || [];
    if (resourceAllowed.includes(field)) {
      sortOption = { [field]: isDescending ? -1 : 1 };
    } else {
      throw new ApiError(
        400,
        `Invalid sort field '${field}'. Allowed sort fields for ${resource}: ${resourceAllowed.join(", ")}`
      );
    }
  }

  return { page, limit, skip, sort: sortOption };
}

/**
 * Formats standard paginated response payload.
 */
function sendPaginatedResponse(res, { data, total, page, limit, message = "Data retrieved successfully" }) {
  const totalPages = Math.ceil(total / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return res.status(200).json({
    success: true,
    message,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage
    },
    data
  });
}

module.exports = {
  escapeRegex,
  isValidObjectId,
  parseQueryOptions,
  sendPaginatedResponse
};
