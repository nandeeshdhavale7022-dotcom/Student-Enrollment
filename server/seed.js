require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Student = require("./models/Student");
const Course = require("./models/Course");
const Enrollment = require("./models/Enrollment");

const sampleStudents = [
  {
    first_name: "Alice",
    last_name: "Johnson",
    email: "alice.johnson@university.edu",
    date_of_birth: new Date("2003-04-12"),
    enrollment_date: new Date("2022-09-01")
  },
  {
    first_name: "Bob",
    last_name: "Smith",
    email: "bob.smith@university.edu",
    date_of_birth: new Date("2002-11-23"),
    enrollment_date: new Date("2021-09-01")
  },
  {
    first_name: "Charlie",
    last_name: "Davis",
    email: "charlie.davis@university.edu",
    date_of_birth: new Date("2004-01-15"),
    enrollment_date: new Date("2023-01-15")
  },
  {
    first_name: "Diana",
    last_name: "Prince",
    email: "diana.prince@university.edu",
    date_of_birth: new Date("2003-08-30"),
    enrollment_date: new Date("2022-09-01")
  },
  {
    first_name: "Evan",
    last_name: "Wright",
    email: "evan.wright@university.edu",
    date_of_birth: new Date("2001-06-05"),
    enrollment_date: new Date("2020-09-01")
  }
];

const sampleCourses = [
  {
    course_code: "CS101",
    title: "Introduction to Computer Science",
    description: "Fundamental concepts of programming, algorithms, and computational thinking.",
    credits: 4,
    instructor: "Dr. Alan Turing"
  },
  {
    course_code: "CS201",
    title: "Data Structures and Algorithms",
    description: "In-depth study of stacks, queues, trees, graphs, sorting, and dynamic programming.",
    credits: 4,
    instructor: "Dr. Ada Lovelace"
  },
  {
    course_code: "DB301",
    title: "Database Management Systems",
    description: "Relational database design, SQL, normalization, transactions, and NoSQL databases.",
    credits: 3,
    instructor: "Prof. Edgar Codd"
  },
  {
    course_code: "MATH150",
    title: "Discrete Mathematics",
    description: "Logic, set theory, combinatorics, graph theory, and proof techniques.",
    credits: 3,
    instructor: "Dr. John von Neumann"
  },
  {
    course_code: "WEB220",
    title: "Full-Stack Web Development",
    description: "Building modern web applications with RESTful APIs, Node.js, and client frameworks.",
    credits: 4,
    instructor: "Prof. Tim Berners-Lee"
  }
];

async function seedDatabase() {
  try {
    await connectDB();
    console.log("[Seeder] Connected to database...");

    // Clear existing collections
    console.log("[Seeder] Clearing old records...");
    await Promise.all([
      Student.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({})
    ]);

    // Insert students
    console.log("[Seeder] Inserting students...");
    const createdStudents = await Student.insertMany(sampleStudents);

    // Insert courses
    console.log("[Seeder] Inserting courses...");
    const createdCourses = await Course.insertMany(sampleCourses);

    // Create sample enrollments linking students and courses
    console.log("[Seeder] Enrolling students into courses...");
    const sampleEnrollments = [
      {
        student: createdStudents[0]._id, // Alice
        course: createdCourses[0]._id,   // CS101
        grade: "A",
        status: "completed"
      },
      {
        student: createdStudents[0]._id, // Alice
        course: createdCourses[2]._id,   // DB301
        grade: "Not Graded",
        status: "active"
      },
      {
        student: createdStudents[1]._id, // Bob
        course: createdCourses[1]._id,   // CS201
        grade: "B",
        status: "completed"
      },
      {
        student: createdStudents[1]._id, // Bob
        course: createdCourses[2]._id,   // DB301
        grade: "A",
        status: "active"
      },
      {
        student: createdStudents[2]._id, // Charlie
        course: createdCourses[0]._id,   // CS101
        grade: "Not Graded",
        status: "active"
      },
      {
        student: createdStudents[3]._id, // Diana
        course: createdCourses[3]._id,   // MATH150
        grade: "A",
        status: "completed"
      },
      {
        student: createdStudents[3]._id, // Diana
        course: createdCourses[4]._id,   // WEB220
        grade: "Not Graded",
        status: "active"
      },
      {
        student: createdStudents[4]._id, // Evan
        course: createdCourses[4]._id,   // WEB220
        grade: "C",
        status: "dropped"
      }
    ];

    await Enrollment.insertMany(sampleEnrollments);

    console.log(`\n Successfully seeded database:`);
    console.log(` - ${createdStudents.length} Students`);
    console.log(` - ${createdCourses.length} Courses`);
    console.log(` - ${sampleEnrollments.length} Enrollments`);

    process.exit(0);
  } catch (error) {
    console.error("[Seeder Error]", error);
    process.exit(1);
  }
}

seedDatabase();
