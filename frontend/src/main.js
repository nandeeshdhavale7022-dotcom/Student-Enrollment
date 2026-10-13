/**
 * EduTrack Frontend - Main Application Logic
 * Integrates directly with the Student Record Management REST API.
 */

const API_BASE = "http://localhost:5000/api";

// Global App State
const state = {
  currentTab: "dashboard",
  students: {
    data: [],
    page: 1,
    limit: 10,
    total: 0,
    search: "",
    sort: "-createdAt"
  },
  courses: {
    data: [],
    page: 1,
    limit: 9,
    total: 0,
    search: "",
    credits: "",
    sort: "-createdAt"
  },
  enrollments: {
    data: [],
    page: 1,
    limit: 10,
    total: 0,
    status: "",
    grade: "",
    sort: "-createdAt"
  },
  cache: {
    studentsList: [],
    coursesList: []
  }
};

// ============================================================================
// Utilities & Toast Notifications
// ============================================================================

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconSvg = type === "success" 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  toast.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>'"]/g, tag => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[tag] || tag));
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date)) return "N/A";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ============================================================================
// API Service Calls
// ============================================================================

async function apiRequest(endpoint, options = {}) {
  try {
    const fetchOptions = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    };

    if (options.body && typeof options.body === "object") {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
    const data = await res.json().catch(() => ({ success: false, message: "Invalid JSON response" }));

    if (!res.ok) {
      let errorMsg = data.message || `HTTP Error ${res.status}`;
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errorMsg = data.errors.map(err => err.message || err.msg).join("; ");
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

// Check Backend Health & Database Connectivity
async function checkApiHealth() {
  const dot = document.getElementById("api-status-dot");
  const text = document.getElementById("api-status-text");

  try {
    const res = await apiRequest("/health");
    if (res.database && res.database.status === "connected") {
      dot.className = "dot connected";
      text.textContent = "Online • MongoDB Connected";
    } else {
      dot.className = "dot disconnected";
      text.textContent = "Server Online • DB Disconnected";
    }
  } catch {
    dot.className = "dot disconnected";
    text.textContent = "Offline • Backend Unreachable";
  }
}

// ============================================================================
// Tab Navigation
// ============================================================================

const tabTitles = {
  dashboard: { title: "Dashboard Overview", subtitle: "Real-time statistics and academic activity." },
  students: { title: "Students Directory", subtitle: "Manage enrolled student profiles and course enrollments." },
  courses: { title: "Academic Courses", subtitle: "Browse, filter, and organize academic departments and curricula." },
  enrollments: { title: "Course Enrollments", subtitle: "Assign students, track grades, and manage course statuses." }
};

function switchTab(tabName) {
  state.currentTab = tabName;

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-view").forEach(view => {
    view.classList.toggle("active", view.id === `view-${tabName}`);
  });

  const titles = tabTitles[tabName] || tabTitles.dashboard;
  document.getElementById("page-title").textContent = titles.title;
  document.getElementById("page-subtitle").textContent = titles.subtitle;

  if (tabName === "dashboard") loadDashboard();
  if (tabName === "students") loadStudents();
  if (tabName === "courses") loadCourses();
  if (tabName === "enrollments") loadEnrollments();
}

// ============================================================================
// 1. Dashboard View
// ============================================================================

async function loadDashboard() {
  try {
    const [studentsRes, coursesRes, enrollmentsRes] = await Promise.all([
      apiRequest("/students?limit=1"),
      apiRequest("/courses?limit=1"),
      apiRequest("/enrollments?limit=5&sort=-createdAt")
    ]);

    const totalStudents = studentsRes.pagination?.total || 0;
    const totalCourses = coursesRes.pagination?.total || 0;
    const totalEnrollments = enrollmentsRes.pagination?.total || 0;

    // Update counts
    document.getElementById("stat-students").textContent = totalStudents;
    document.getElementById("stat-courses").textContent = totalCourses;
    document.getElementById("stat-enrollments").textContent = totalEnrollments;

    document.getElementById("badge-students-count").textContent = totalStudents;
    document.getElementById("badge-courses-count").textContent = totalCourses;
    document.getElementById("badge-enrollments-count").textContent = totalEnrollments;

    // Completed enrollments count
    const completedRes = await apiRequest("/enrollments?status=completed&limit=1");
    document.getElementById("stat-completed").textContent = completedRes.pagination?.total || 0;

    // Render Recent Enrollments list
    const recentContainer = document.getElementById("dash-recent-enrollments");
    if (!enrollmentsRes.data || enrollmentsRes.data.length === 0) {
      recentContainer.innerHTML = `<div class="empty-state">No enrollments registered yet.</div>`;
    } else {
      recentContainer.innerHTML = enrollmentsRes.data.map(item => `
        <div class="recent-item">
          <div class="recent-left">
            <div class="avatar-sm">${item.student?.first_name ? item.student.first_name[0] : "?"}</div>
            <div class="recent-info">
              <h5>${escapeHtml(item.student?.first_name || "Unknown")} ${escapeHtml(item.student?.last_name || "")}</h5>
              <span>${escapeHtml(item.course?.course_code || "")} - ${escapeHtml(item.course?.title || "Unknown Course")}</span>
            </div>
          </div>
          <div>
            <span class="badge badge-${item.status || "active"}">${escapeHtml(item.status || "active")}</span>
          </div>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error("Dashboard load failed:", err);
  }
}

// ============================================================================
// 2. Students Tab View
// ============================================================================

async function loadStudents() {
  const tbody = document.getElementById("students-table-body");
  tbody.innerHTML = `<tr><td colspan="5" class="text-center">Loading students...</td></tr>`;

  try {
    const { page, limit, search, sort } = state.students;
    let url = `/students?page=${page}&limit=${limit}&sort=${sort}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await apiRequest(url);
    state.students.data = res.data;
    state.students.total = res.pagination.total;

    // Update pagination controls
    const totalPages = res.pagination.totalPages || 1;
    document.getElementById("students-pagination-info").textContent = 
      `Showing ${res.data.length} of ${res.pagination.total} students`;
    document.getElementById("students-page-indicator").textContent = 
      `Page ${res.pagination.currentPage} of ${totalPages}`;
    document.getElementById("students-prev-page").disabled = !res.pagination.hasPrevPage;
    document.getElementById("students-next-page").disabled = !res.pagination.hasNextPage;

    if (!res.data.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center empty-state">No students found matching your criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map(s => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div class="avatar-sm">${s.first_name ? s.first_name[0] : "?"}</div>
            <div>
              <strong style="color:#fff;">${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)}</strong>
              <div style="font-size:0.75rem;color:var(--text-muted);font-family:monospace;">ID: ${s._id}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(s.email)}</td>
        <td>${formatDate(s.date_of_birth)}</td>
        <td>${formatDate(s.enrollment_date)}</td>
        <td class="text-right">
          <div class="action-group">
            <button class="btn btn-outline btn-sm" onclick="window.viewStudentDetails('${s._id}')" title="View Enrolled Courses">
              View
            </button>
            <button class="btn btn-outline btn-sm" onclick="window.openEditStudent('${s._id}')" title="Edit Student">
              Edit
            </button>
            <button class="btn btn-danger-outline btn-sm" onclick="window.deleteStudent('${s._id}', '${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)}')" title="Delete Student">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--accent-rose);">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

// Student Details & Relational View
window.viewStudentDetails = async function (id) {
  try {
    const res = await apiRequest(`/students/${id}`);
    const student = res.data;

    const modalTitle = document.getElementById("modal-relation-title");
    const modalBody = document.getElementById("modal-relation-body");

    modalTitle.textContent = `Student Profile: ${student.first_name} ${student.last_name}`;

    const enrollmentsHtml = student.enrollments && student.enrollments.length > 0
      ? `
        <table class="data-table" style="margin-top:1rem;">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Title</th>
              <th>Credits</th>
              <th>Status</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            ${student.enrollments.map(e => `
              <tr>
                <td><span class="badge badge-code">${escapeHtml(e.course?.course_code || "N/A")}</span></td>
                <td>${escapeHtml(e.course?.title || "N/A")}</td>
                <td>${escapeHtml(String(e.course?.credits || "-"))}</td>
                <td><span class="badge badge-${e.status}">${escapeHtml(e.status)}</span></td>
                <td><span class="badge badge-grade">${escapeHtml(e.grade)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `
      : `<div class="empty-state">This student has not enrolled in any courses yet.</div>`;

    modalBody.innerHTML = `
      <div style="background:rgba(255,255,255,0.03);padding:1rem;border-radius:8px;border:1px solid var(--border-color);margin-bottom:1.5rem;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <div><strong style="color:var(--text-muted);font-size:0.8rem;">EMAIL:</strong><br>${escapeHtml(student.email)}</div>
          <div><strong style="color:var(--text-muted);font-size:0.8rem;">DATE OF BIRTH:</strong><br>${formatDate(student.date_of_birth)}</div>
          <div><strong style="color:var(--text-muted);font-size:0.8rem;">ENROLLMENT DATE:</strong><br>${formatDate(student.enrollment_date)}</div>
          <div><strong style="color:var(--text-muted);font-size:0.8rem;">TOTAL COURSES:</strong><br>${student.enrollments?.length || 0} enrolled</div>
        </div>
      </div>
      <h4 style="font-family:var(--font-display);font-size:1rem;margin-bottom:0.5rem;">Enrolled Courses (${student.enrollments?.length || 0})</h4>
      ${enrollmentsHtml}
    `;

    document.getElementById("modal-relation-viewer").classList.remove("hidden");
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.openEditStudent = async function (id) {
  try {
    const res = await apiRequest(`/students/${id}`);
    const student = res.data;

    document.getElementById("modal-student-title").textContent = "Edit Student Profile";
    document.getElementById("student-form-id").value = student._id;
    document.getElementById("student-first-name").value = student.first_name;
    document.getElementById("student-last-name").value = student.last_name;
    document.getElementById("student-email").value = student.email;
    document.getElementById("student-dob").value = student.date_of_birth ? student.date_of_birth.substring(0, 10) : "";
    document.getElementById("student-enrollment-date").value = student.enrollment_date ? student.enrollment_date.substring(0, 10) : "";

    document.getElementById("modal-student").classList.remove("hidden");
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.deleteStudent = async function (id, name) {
  if (!confirm(`Are you sure you want to delete ${name}?\n\nThis will also cascade delete all enrollments associated with this student.`)) {
    return;
  }

  try {
    await apiRequest(`/students/${id}`, { method: "DELETE" });
    showToast(`Student ${name} deleted successfully`);
    loadStudents();
    loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
};

// ============================================================================
// 3. Courses Tab View
// ============================================================================

async function loadCourses() {
  const container = document.getElementById("courses-grid");
  container.innerHTML = `<div class="empty-state">Loading courses...</div>`;

  try {
    const { page, limit, search, credits, sort } = state.courses;
    let url = `/courses?page=${page}&limit=${limit}&sort=${sort}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (credits) url += `&credits=${encodeURIComponent(credits)}`;

    const res = await apiRequest(url);
    state.courses.data = res.data;
    state.courses.total = res.pagination.total;

    // Update pagination controls
    const totalPages = res.pagination.totalPages || 1;
    document.getElementById("courses-pagination-info").textContent = 
      `Showing ${res.data.length} of ${res.pagination.total} courses`;
    document.getElementById("courses-page-indicator").textContent = 
      `Page ${res.pagination.currentPage} of ${totalPages}`;
    document.getElementById("courses-prev-page").disabled = !res.pagination.hasPrevPage;
    document.getElementById("courses-next-page").disabled = !res.pagination.hasNextPage;

    if (!res.data.length) {
      container.innerHTML = `<div class="empty-state">No courses found matching your criteria.</div>`;
      return;
    }

    container.innerHTML = res.data.map(c => `
      <div class="course-card">
        <div>
          <div class="course-card-top">
            <span class="badge badge-code">${escapeHtml(c.course_code)}</span>
            <span class="badge badge-completed">${c.credits} Credits</span>
          </div>
          <h4>${escapeHtml(c.title)}</h4>
          <p>${escapeHtml(c.description || "No description provided.")}</p>
        </div>
        <div>
          <div class="course-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Instructor: ${escapeHtml(c.instructor)}</span>
          </div>
          <div class="course-card-footer">
            <button class="btn btn-outline btn-sm" onclick="window.viewCourseDetails('${c._id}')">Enrolled Students</button>
            <div class="action-group">
              <button class="btn btn-outline btn-sm" onclick="window.openEditCourse('${c._id}')">Edit</button>
              <button class="btn btn-danger-outline btn-sm" onclick="window.deleteCourse('${c._id}', '${escapeHtml(c.course_code)}')">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color:var(--accent-rose);">Error: ${escapeHtml(err.message)}</div>`;
  }
}

// Course Details & Relational View
window.viewCourseDetails = async function (id) {
  try {
    const res = await apiRequest(`/courses/${id}`);
    const course = res.data;

    const modalTitle = document.getElementById("modal-relation-title");
    const modalBody = document.getElementById("modal-relation-body");

    modalTitle.textContent = `Course Roster: ${course.course_code} - ${course.title}`;

    const studentsHtml = course.enrollments && course.enrollments.length > 0
      ? `
        <table class="data-table" style="margin-top:1rem;">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            ${course.enrollments.map(e => `
              <tr>
                <td><strong>${escapeHtml(e.student?.first_name || "N/A")} ${escapeHtml(e.student?.last_name || "")}</strong></td>
                <td>${escapeHtml(e.student?.email || "N/A")}</td>
                <td><span class="badge badge-${e.status}">${escapeHtml(e.status)}</span></td>
                <td><span class="badge badge-grade">${escapeHtml(e.grade)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `
      : `<div class="empty-state">No students are currently enrolled in this course.</div>`;

    modalBody.innerHTML = `
      <div style="background:rgba(255,255,255,0.03);padding:1rem;border-radius:8px;border:1px solid var(--border-color);margin-bottom:1.5rem;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <div><strong style="color:var(--text-muted);font-size:0.8rem;">INSTRUCTOR:</strong><br>${escapeHtml(course.instructor)}</div>
          <div><strong style="color:var(--text-muted);font-size:0.8rem;">CREDITS:</strong><br>${course.credits} Credits</div>
          <div><strong style="color:var(--text-muted);font-size:0.8rem;">ENROLLED STUDENTS:</strong><br>${course.enrollments?.length || 0} students</div>
          <div><strong style="color:var(--text-muted);font-size:0.8rem;">DESCRIPTION:</strong><br>${escapeHtml(course.description || "N/A")}</div>
        </div>
      </div>
      <h4 style="font-family:var(--font-display);font-size:1rem;margin-bottom:0.5rem;">Enrolled Students (${course.enrollments?.length || 0})</h4>
      ${studentsHtml}
    `;

    document.getElementById("modal-relation-viewer").classList.remove("hidden");
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.openEditCourse = async function (id) {
  try {
    const res = await apiRequest(`/courses/${id}`);
    const course = res.data;

    document.getElementById("modal-course-title").textContent = "Edit Course";
    document.getElementById("course-form-id").value = course._id;
    document.getElementById("course-code").value = course.course_code;
    document.getElementById("course-title").value = course.title;
    document.getElementById("course-credits").value = course.credits;
    document.getElementById("course-instructor").value = course.instructor;
    document.getElementById("course-description").value = course.description || "";

    document.getElementById("modal-course").classList.remove("hidden");
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.deleteCourse = async function (id, code) {
  if (!confirm(`Are you sure you want to delete course ${code}?\n\nThis will also cascade delete all enrollments in this course.`)) {
    return;
  }

  try {
    await apiRequest(`/courses/${id}`, { method: "DELETE" });
    showToast(`Course ${code} deleted successfully`);
    loadCourses();
    loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
};

// ============================================================================
// 4. Enrollments Tab View
// ============================================================================

async function loadEnrollments() {
  const tbody = document.getElementById("enrollments-table-body");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center">Loading enrollments...</td></tr>`;

  try {
    const { page, limit, status, grade, sort } = state.enrollments;
    let url = `/enrollments?page=${page}&limit=${limit}&sort=${sort}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (grade) url += `&grade=${encodeURIComponent(grade)}`;

    const res = await apiRequest(url);
    state.enrollments.data = res.data;
    state.enrollments.total = res.pagination.total;

    // Update pagination controls
    const totalPages = res.pagination.totalPages || 1;
    document.getElementById("enrollments-pagination-info").textContent = 
      `Showing ${res.data.length} of ${res.pagination.total} enrollments`;
    document.getElementById("enrollments-page-indicator").textContent = 
      `Page ${res.pagination.currentPage} of ${totalPages}`;
    document.getElementById("enrollments-prev-page").disabled = !res.pagination.hasPrevPage;
    document.getElementById("enrollments-next-page").disabled = !res.pagination.hasNextPage;

    if (!res.data.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center empty-state">No enrollments found matching your criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map(e => `
      <tr>
        <td>
          <strong>${escapeHtml(e.student?.first_name || "Unknown")} ${escapeHtml(e.student?.last_name || "")}</strong>
          <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(e.student?.email || "")}</div>
        </td>
        <td>
          <span class="badge badge-code">${escapeHtml(e.course?.course_code || "N/A")}</span>
          <span style="margin-left:0.35rem;">${escapeHtml(e.course?.title || "")}</span>
        </td>
        <td>
          <span class="badge badge-${e.status}">${escapeHtml(e.status)}</span>
        </td>
        <td>
          <span class="badge badge-grade">${escapeHtml(e.grade)}</span>
        </td>
        <td>${formatDate(e.enrollment_date)}</td>
        <td class="text-right">
          <div class="action-group">
            <button class="btn btn-outline btn-sm" onclick="window.openEditEnrollment('${e._id}', '${e.status}', '${e.grade}')">
              Update
            </button>
            <button class="btn btn-danger-outline btn-sm" onclick="window.deleteEnrollment('${e._id}')">
              Drop
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--accent-rose);">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

window.openEditEnrollment = function (id, status, grade) {
  document.getElementById("modal-enrollment-title").textContent = "Update Enrollment Status & Grade";
  document.getElementById("enrollment-form-id").value = id;

  // Hide student/course dropdowns on edit
  document.getElementById("group-enrollment-student").style.display = "none";
  document.getElementById("group-enrollment-course").style.display = "none";

  document.getElementById("enrollment-status-select").value = status || "active";
  document.getElementById("enrollment-grade-select").value = grade || "Not Graded";

  document.getElementById("modal-enrollment").classList.remove("hidden");
};

window.deleteEnrollment = async function (id) {
  if (!confirm("Are you sure you want to drop / remove this enrollment?")) {
    return;
  }

  try {
    await apiRequest(`/enrollments/${id}`, { method: "DELETE" });
    showToast("Enrollment removed successfully");
    loadEnrollments();
    loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
};

// Populate Student and Course Select Dropdowns for New Enrollment Modal
async function populateEnrollmentDropdowns() {
  const studentSelect = document.getElementById("enrollment-student-select");
  const courseSelect = document.getElementById("enrollment-course-select");

  try {
    const [studentsRes, coursesRes] = await Promise.all([
      apiRequest("/students?limit=100&sort=first_name"),
      apiRequest("/courses?limit=100&sort=course_code")
    ]);

    studentSelect.innerHTML = `<option value="">-- Choose a Student --</option>` +
      studentsRes.data.map(s => `<option value="${s._id}">${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)} (${escapeHtml(s.email)})</option>`).join("");

    courseSelect.innerHTML = `<option value="">-- Choose a Course --</option>` +
      coursesRes.data.map(c => `<option value="${c._id}">${escapeHtml(c.course_code)} - ${escapeHtml(c.title)} (${c.credits} Cr)</option>`).join("");
  } catch (err) {
    console.error("Failed to populate dropdowns:", err);
  }
}

function openNewEnrollmentModal() {
  document.getElementById("modal-enrollment-title").textContent = "Enroll Student in Course";
  document.getElementById("enrollment-form-id").value = "";

  document.getElementById("group-enrollment-student").style.display = "block";
  document.getElementById("group-enrollment-course").style.display = "block";

  document.getElementById("enrollment-status-select").value = "active";
  document.getElementById("enrollment-grade-select").value = "Not Graded";

  populateEnrollmentDropdowns();
  document.getElementById("modal-enrollment").classList.remove("hidden");
}

// ============================================================================
// Event Listeners & Modals Handlers
// ============================================================================

function initEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Top bar quick actions
  document.getElementById("btn-quick-enroll").addEventListener("click", openNewEnrollmentModal);
  document.getElementById("btn-seed-data").addEventListener("click", () => {
    showToast("Refreshing data from server...", "info");
    checkApiHealth();
    if (state.currentTab === "dashboard") loadDashboard();
    if (state.currentTab === "students") loadStudents();
    if (state.currentTab === "courses") loadCourses();
    if (state.currentTab === "enrollments") loadEnrollments();
  });

  // Dashboard Tiles
  document.getElementById("dash-btn-add-student")?.addEventListener("click", () => {
    document.getElementById("modal-student-title").textContent = "Register New Student";
    document.getElementById("form-student").reset();
    document.getElementById("student-form-id").value = "";
    document.getElementById("modal-student").classList.remove("hidden");
  });

  document.getElementById("dash-btn-add-course")?.addEventListener("click", () => {
    document.getElementById("modal-course-title").textContent = "Create New Course";
    document.getElementById("form-course").reset();
    document.getElementById("course-form-id").value = "";
    document.getElementById("modal-course").classList.remove("hidden");
  });

  document.getElementById("dash-btn-enroll")?.addEventListener("click", openNewEnrollmentModal);
  document.getElementById("dash-btn-view-all-enrollments")?.addEventListener("click", () => switchTab("enrollments"));

  // Students Tab Controls
  document.getElementById("btn-open-add-student").addEventListener("click", () => {
    document.getElementById("modal-student-title").textContent = "Register New Student";
    document.getElementById("form-student").reset();
    document.getElementById("student-form-id").value = "";
    document.getElementById("modal-student").classList.remove("hidden");
  });

  document.getElementById("students-search").addEventListener("input", debounce(e => {
    state.students.search = e.target.value;
    state.students.page = 1;
    loadStudents();
  }));

  document.getElementById("students-sort").addEventListener("change", e => {
    state.students.sort = e.target.value;
    state.students.page = 1;
    loadStudents();
  });

  document.getElementById("students-prev-page").addEventListener("click", () => {
    if (state.students.page > 1) {
      state.students.page--;
      loadStudents();
    }
  });

  document.getElementById("students-next-page").addEventListener("click", () => {
    state.students.page++;
    loadStudents();
  });

  // Courses Tab Controls
  document.getElementById("btn-open-add-course").addEventListener("click", () => {
    document.getElementById("modal-course-title").textContent = "Create New Course";
    document.getElementById("form-course").reset();
    document.getElementById("course-form-id").value = "";
    document.getElementById("modal-course").classList.remove("hidden");
  });

  document.getElementById("courses-search").addEventListener("input", debounce(e => {
    state.courses.search = e.target.value;
    state.courses.page = 1;
    loadCourses();
  }));

  document.getElementById("courses-credit-filter").addEventListener("change", e => {
    state.courses.credits = e.target.value;
    state.courses.page = 1;
    loadCourses();
  });

  document.getElementById("courses-sort").addEventListener("change", e => {
    state.courses.sort = e.target.value;
    state.courses.page = 1;
    loadCourses();
  });

  document.getElementById("courses-prev-page").addEventListener("click", () => {
    if (state.courses.page > 1) {
      state.courses.page--;
      loadCourses();
    }
  });

  document.getElementById("courses-next-page").addEventListener("click", () => {
    state.courses.page++;
    loadCourses();
  });

  // Enrollments Tab Controls
  document.getElementById("btn-open-add-enrollment").addEventListener("click", openNewEnrollmentModal);

  document.getElementById("enrollments-status-filter").addEventListener("change", e => {
    state.enrollments.status = e.target.value;
    state.enrollments.page = 1;
    loadEnrollments();
  });

  document.getElementById("enrollments-grade-filter").addEventListener("change", e => {
    state.enrollments.grade = e.target.value;
    state.enrollments.page = 1;
    loadEnrollments();
  });

  document.getElementById("enrollments-sort").addEventListener("change", e => {
    state.enrollments.sort = e.target.value;
    state.enrollments.page = 1;
    loadEnrollments();
  });

  document.getElementById("enrollments-prev-page").addEventListener("click", () => {
    if (state.enrollments.page > 1) {
      state.enrollments.page--;
      loadEnrollments();
    }
  });

  document.getElementById("enrollments-next-page").addEventListener("click", () => {
    state.enrollments.page++;
    loadEnrollments();
  });

  // Modal Close Buttons
  const closeModal = modalId => document.getElementById(modalId).classList.add("hidden");

  document.getElementById("btn-close-student-modal").addEventListener("click", () => closeModal("modal-student"));
  document.getElementById("btn-cancel-student").addEventListener("click", () => closeModal("modal-student"));

  document.getElementById("btn-close-course-modal").addEventListener("click", () => closeModal("modal-course"));
  document.getElementById("btn-cancel-course").addEventListener("click", () => closeModal("modal-course"));

  document.getElementById("btn-close-enrollment-modal").addEventListener("click", () => closeModal("modal-enrollment"));
  document.getElementById("btn-cancel-enrollment").addEventListener("click", () => closeModal("modal-enrollment"));

  document.getElementById("btn-close-relation-modal").addEventListener("click", () => closeModal("modal-relation-viewer"));
  document.getElementById("btn-close-relation-btn").addEventListener("click", () => closeModal("modal-relation-viewer"));

  // ============================================================================
  // Form Submissions
  // ============================================================================

  // Student Form Submit
  document.getElementById("form-student").addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("student-form-id").value;
    const body = {
      first_name: document.getElementById("student-first-name").value.trim(),
      last_name: document.getElementById("student-last-name").value.trim(),
      email: document.getElementById("student-email").value.trim(),
      date_of_birth: document.getElementById("student-dob").value
    };

    const enrollmentDateVal = document.getElementById("student-enrollment-date").value;
    if (enrollmentDateVal) {
      body.enrollment_date = enrollmentDateVal;
    }

    const dobDate = new Date(body.date_of_birth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dobDate >= today) {
      showToast("Date of birth must be a past date (before today)", "error");
      return;
    }

    try {
      if (id) {
        await apiRequest(`/students/${id}`, { method: "PUT", body });
        showToast("Student profile updated successfully");
      } else {
        await apiRequest("/students", { method: "POST", body });
        showToast("New student registered successfully");
      }
      closeModal("modal-student");
      loadStudents();
      loadDashboard();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // Course Form Submit
  document.getElementById("form-course").addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("course-form-id").value;
    const body = {
      course_code: document.getElementById("course-code").value.trim().toUpperCase(),
      title: document.getElementById("course-title").value.trim(),
      credits: Number(document.getElementById("course-credits").value),
      instructor: document.getElementById("course-instructor").value.trim(),
      description: document.getElementById("course-description").value.trim()
    };

    try {
      if (id) {
        await apiRequest(`/courses/${id}`, { method: "PUT", body });
        showToast("Course details updated successfully");
      } else {
        await apiRequest("/courses", { method: "POST", body });
        showToast("New course created successfully");
      }
      closeModal("modal-course");
      loadCourses();
      loadDashboard();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // Enrollment Form Submit
  document.getElementById("form-enrollment").addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("enrollment-form-id").value;

    try {
      if (id) {
        const body = {
          status: document.getElementById("enrollment-status-select").value,
          grade: document.getElementById("enrollment-grade-select").value
        };
        await apiRequest(`/enrollments/${id}`, { method: "PUT", body });
        showToast("Enrollment status & grade updated");
      } else {
        const body = {
          student: document.getElementById("enrollment-student-select").value,
          course: document.getElementById("enrollment-course-select").value,
          status: document.getElementById("enrollment-status-select").value,
          grade: document.getElementById("enrollment-grade-select").value
        };

        if (!body.student || !body.course) {
          showToast("Please select both a student and a course", "error");
          return;
        }

        await apiRequest("/enrollments", { method: "POST", body });
        showToast("Student enrolled successfully");
      }

      closeModal("modal-enrollment");
      loadEnrollments();
      loadDashboard();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

// ============================================================================
// Initialization
// ============================================================================

window.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  checkApiHealth();
  loadDashboard();

  // Restrict student date of birth to past dates
  const dobInput = document.getElementById("student-dob");
  if (dobInput) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    dobInput.max = yesterday.toISOString().split("T")[0];
  }

  // Periodically check API health every 15s
  setInterval(checkApiHealth, 15000);
});
