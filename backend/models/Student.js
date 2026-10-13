const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"]
    },
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [1, "Last name must be at least 1 character"],
      maxlength: [50, "Last name cannot exceed 50 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    date_of_birth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (value) {
          return value instanceof Date && !isNaN(value) && value < new Date();
        },
        message: "Date of birth must be a valid date in the past"
      }
    },
    enrollment_date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for full name
studentSchema.virtual("full_name").get(function () {
  return `${this.first_name} ${this.last_name}`;
});

// Virtual populate for student's enrollments
studentSchema.virtual("enrollments", {
  ref: "Enrollment",
  localField: "_id",
  foreignField: "student"
});

// Index for compound name search
studentSchema.index({ first_name: 1, last_name: 1 });

module.exports = mongoose.model("Student", studentSchema);
