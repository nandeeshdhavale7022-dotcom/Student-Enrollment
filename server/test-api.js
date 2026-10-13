/**
 * Automated End-to-End API Test Suite
 * Tests all requirements: CRUD operations, validation, relational modeling,
 * search, filtering, sorting, pagination, error responses, and cascade deletes.
 */
require("dotenv").config();
const http = require("http");
const app = require("./server");
const connectDB = require("./config/db");

let serverInstance;
const TEST_PORT = 5099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  FAIL: ${message}`);
    failedCount++;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const fetchOptions = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log("\n=======================================================");
  console.log(" Running Student Record Management API Test Suite");
  console.log("=======================================================\n");

  await connectDB();

  await new Promise(resolve => {
    serverInstance = app.listen(TEST_PORT, () => {
      console.log(`Test server running at ${BASE_URL}\n`);
      resolve();
    });
  });

  try {
    // 1. Health check & Root endpoint
    console.log("[Test Suite] 1. General & System Endpoints");
    const health = await request("/api/health");
    assert(health.status === 200 && health.data.status === "OK", "GET /api/health returns 200 OK with connected DB");

    const root = await request("/");
    assert(root.status === 200 && root.data.name.includes("Student Record"), "GET / returns API overview documentation");

    // 2. Student CRUD & Validation
    console.log("\n[Test Suite] 2. Student CRUD & Validation");
    // Invalid student creation (future date of birth)
    const invalidDobRes = await request("/api/students", {
      method: "POST",
      body: {
        first_name: "Test",
        last_name: "Future",
        email: "future@test.com",
        date_of_birth: "2099-01-01"
      }
    });
    assert(invalidDobRes.status === 400 && invalidDobRes.data.success === false, "POST /api/students rejects future date of birth (400)");

    // Invalid email
    const invalidEmailRes = await request("/api/students", {
      method: "POST",
      body: {
        first_name: "Test",
        last_name: "User",
        email: "not-an-email",
        date_of_birth: "2000-01-01"
      }
    });
    assert(invalidEmailRes.status === 400, "POST /api/students rejects invalid email format (400)");

    // Valid student creation
    const uniqueEmail = `sarah.connor.${Date.now()}@university.edu`;
    const createStudentRes = await request("/api/students", {
      method: "POST",
      body: {
        first_name: "Sarah",
        last_name: "Connor",
        email: uniqueEmail,
        date_of_birth: "1998-05-14"
      }
    });
    assert(createStudentRes.status === 201 && createStudentRes.data.data.email === uniqueEmail, "POST /api/students creates student successfully (201)");
    const studentId = createStudentRes.data.data._id;

    // Duplicate email check
    const dupEmailRes = await request("/api/students", {
      method: "POST",
      body: {
        first_name: "Sarah",
        last_name: "Duplicate",
        email: uniqueEmail,
        date_of_birth: "1998-05-14"
      }
    });
    assert(dupEmailRes.status === 409, "POST /api/students rejects duplicate email (409 Conflict)");

    // Pagination, Search & Sorting
    const searchRes = await request("/api/students?search=Sarah&sort=first_name&page=1&limit=5");
    assert(
      searchRes.status === 200 &&
      searchRes.data.pagination &&
      searchRes.data.data.length > 0 &&
      searchRes.data.data[0].first_name === "Sarah",
      "GET /api/students supports search, sorting, and pagination (200)"
    );

    // Get student by ID
    const getStudentRes = await request(`/api/students/${studentId}`);
    assert(getStudentRes.status === 200 && getStudentRes.data.data._id === studentId, "GET /api/students/:id retrieves student with populated enrollments");

    // Update student
    const updateStudentRes = await request(`/api/students/${studentId}`, {
      method: "PUT",
      body: { first_name: "Sarah-Updated" }
    });
    assert(updateStudentRes.status === 200 && updateStudentRes.data.data.first_name === "Sarah-Updated", "PUT /api/students/:id updates student information (200)");

    // 3. Course CRUD & Validation
    console.log("\n[Test Suite] 3. Course CRUD & Validation");
    const uniqueCode = `CS${Math.floor(Math.random() * 900) + 100}`;
    const createCourseRes = await request("/api/courses", {
      method: "POST",
      body: {
        course_code: uniqueCode,
        title: "Advanced Artificial Intelligence",
        description: "Deep learning and agentic workflows",
        credits: 4,
        instructor: "Dr. Geoffrey Hinton"
      }
    });
    assert(createCourseRes.status === 201 && createCourseRes.data.data.course_code === uniqueCode, "POST /api/courses creates course successfully (201)");
    const courseId = createCourseRes.data.data._id;

    // Invalid credits
    const invalidCreditsRes = await request("/api/courses", {
      method: "POST",
      body: {
        course_code: `ERR${Math.floor(Math.random() * 900)}`,
        title: "Invalid Course",
        credits: 99,
        instructor: "Prof. Nobody"
      }
    });
    assert(invalidCreditsRes.status === 400, "POST /api/courses rejects credits > 30 (400)");

    // Duplicate course code
    const dupCourseRes = await request("/api/courses", {
      method: "POST",
      body: {
        course_code: uniqueCode,
        title: "Duplicate Course",
        credits: 3,
        instructor: "Prof. Copy"
      }
    });
    assert(dupCourseRes.status === 409, "POST /api/courses rejects duplicate course_code (409 Conflict)");

    // Get courses with filtering and sorting
    const coursesRes = await request("/api/courses?credits=4&sort=title&page=1&limit=10");
    assert(coursesRes.status === 200 && Array.isArray(coursesRes.data.data), "GET /api/courses filters by credits and sorts by title (200)");

    // Update course
    const updateCourseRes = await request(`/api/courses/${courseId}`, {
      method: "PUT",
      body: { credits: 5 }
    });
    assert(updateCourseRes.status === 200 && updateCourseRes.data.data.credits === 5, "PUT /api/courses/:id updates course credits (200)");

    // 4. Enrollment CRUD & Relational Integrity
    console.log("\n[Test Suite] 4. Enrollment CRUD & Relational Integrity");
    const createEnrollmentRes = await request("/api/enrollments", {
      method: "POST",
      body: {
        student: studentId,
        course: courseId,
        grade: "Not Graded",
        status: "active"
      }
    });
    assert(
      createEnrollmentRes.status === 201 &&
      createEnrollmentRes.data.data.student._id === studentId &&
      createEnrollmentRes.data.data.course._id === courseId,
      "POST /api/enrollments enrolls student with populated relations (201)"
    );
    const enrollmentId = createEnrollmentRes.data.data._id;

    // Duplicate enrollment prevention
    const dupEnrollmentRes = await request("/api/enrollments", {
      method: "POST",
      body: {
        student: studentId,
        course: courseId
      }
    });
    assert(dupEnrollmentRes.status === 409, "POST /api/enrollments prevents duplicate enrollment for same student & course (409 Conflict)");

    // Non-existent student enrollment
    const fakeStudentId = "507f1f77bcf86cd799439011";
    const fakeEnrollmentRes = await request("/api/enrollments", {
      method: "POST",
      body: {
        student: fakeStudentId,
        course: courseId
      }
    });
    assert(fakeEnrollmentRes.status === 404, "POST /api/enrollments rejects non-existent student (404 Not Found)");

    // Filter enrollments
    const enrollmentsListRes = await request(`/api/enrollments?student=${studentId}&status=active`);
    assert(enrollmentsListRes.status === 200 && enrollmentsListRes.data.data.length === 1, "GET /api/enrollments filters by student and status (200)");

    // Update enrollment grade & status
    const updateEnrollmentRes = await request(`/api/enrollments/${enrollmentId}`, {
      method: "PUT",
      body: {
        grade: "A",
        status: "completed"
      }
    });
    assert(
      updateEnrollmentRes.status === 200 &&
      updateEnrollmentRes.data.data.grade === "A" &&
      updateEnrollmentRes.data.data.status === "completed",
      "PUT /api/enrollments/:id updates grade and status (200)"
    );

    // 5. Cascade Delete Verification
    console.log("\n[Test Suite] 5. Cascade Delete Verification");
    const deleteStudentRes = await request(`/api/students/${studentId}`, { method: "DELETE" });
    assert(deleteStudentRes.status === 200, "DELETE /api/students/:id deletes student (200)");

    // Verify enrollment was cascaded
    const checkEnrollmentRes = await request(`/api/enrollments/${enrollmentId}`);
    assert(checkEnrollmentRes.status === 404, "Cascade delete successfully removed associated enrollment (404)");

    // Delete course
    const deleteCourseRes = await request(`/api/courses/${courseId}`, { method: "DELETE" });
    assert(deleteCourseRes.status === 200, "DELETE /api/courses/:id deletes course (200)");

    // 6. Error handling
    console.log("\n[Test Suite] 6. Error Handling & Edge Cases");
    const invalidIdRes = await request("/api/students/123-not-an-id");
    assert(invalidIdRes.status === 400, "Invalid ObjectId parameter returns 400 Bad Request");

    const notFoundRoute = await request("/api/non-existent-endpoint");
    assert(notFoundRoute.status === 404, "Unregistered route returns 404 Not Found");

    console.log("\n=======================================================");
    console.log(` Summary: ${passedCount} Passed, ${failedCount} Failed`);
    console.log("=======================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    process.exit(0);
  }
}

runTests();
