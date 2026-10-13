const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    course_code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, "Course code must be at least 2 characters"],
      maxlength: [30, "Course code cannot exceed 30 characters"]
    },
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"]
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    credits: {
      type: Number,
      required: [true, "Credits are required"],
      min: [1, "Credits must be at least 1"],
      max: [30, "Credits cannot exceed 30"],
      validate: {
        validator: Number.isInteger,
        message: "Credits must be an integer"
      }
    },
    instructor: {
      type: String,
      required: [true, "Instructor name is required"],
      trim: true,
      minlength: [2, "Instructor name must be at least 2 characters"],
      maxlength: [100, "Instructor name cannot exceed 100 characters"]
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual populate for course enrollments
courseSchema.virtual("enrollments", {
  ref: "Enrollment",
  localField: "_id",
  foreignField: "course"
});

// Indexes for query performance
courseSchema.index({ instructor: 1 });
courseSchema.index({ credits: 1 });

module.exports = mongoose.model("Course", courseSchema);
