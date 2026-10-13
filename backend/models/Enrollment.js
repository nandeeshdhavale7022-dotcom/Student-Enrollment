const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference ID is required"]
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference ID is required"]
    },
    enrollment_date: {
      type: Date,
      default: Date.now
    },
    grade: {
      type: String,
      enum: {
        values: ["A", "B", "C", "D", "F", "Not Graded"],
        message: "Grade must be one of: A, B, C, D, F, Not Graded"
      },
      default: "Not Graded"
    },
    status: {
      type: String,
      enum: {
        values: ["active", "completed", "dropped"],
        message: "Status must be one of: active, completed, dropped"
      },
      default: "active"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound unique index: a student can only be enrolled in a particular course once
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ grade: 1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
