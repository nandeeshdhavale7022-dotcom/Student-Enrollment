require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");

const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Request Logger (Development mode)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// API Overview / Root Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "Student Record Management REST API",
    version: "1.0.0",
    description: "API for managing student records, courses, and course enrollments",
    documentation: {
      health: "GET /api/health",
      students: {
        list: "GET /api/students?search=&page=1&limit=10&sort=-createdAt",
        getById: "GET /api/students/:id",
        create: "POST /api/students",
        update: "PUT /api/students/:id",
        delete: "DELETE /api/students/:id"
      },
      courses: {
        list: "GET /api/courses?search=&credits=&instructor=&page=1&limit=10&sort=-createdAt",
        getById: "GET /api/courses/:id",
        create: "POST /api/courses",
        update: "PUT /api/courses/:id",
        delete: "DELETE /api/courses/:id"
      },
      enrollments: {
        list: "GET /api/enrollments?student=&course=&status=&grade=&page=1&limit=10&sort=-createdAt",
        getById: "GET /api/enrollments/:id",
        create: "POST /api/enrollments",
        update: "PUT /api/enrollments/:id",
        delete: "DELETE /api/enrollments/:id"
      }
    }
  });
});

// API Health Check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.status(200).json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || "student_records"
    },
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// API Routes
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);

// 404 and Global Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/**
 * Connect to database and start server
 */
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(` Student Record Management API is running!`);
      console.log(` Base URL: http://localhost:${PORT}`);
      console.log(` Health:   http://localhost:${PORT}/api/health`);
      console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error("Critical error during server startup:", error.message);
    process.exit(1);
  }
}

// Start server if executed directly
if (require.main === module) {
  startServer();
}

module.exports = app;