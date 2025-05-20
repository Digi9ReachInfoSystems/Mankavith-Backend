const mongoose = require("mongoose");

// Assuming Subject and MockTest models are already defined and imported
// const Subject = require('./subject.model.js');  // Assuming you have a Subject model
// const MockTest = require('./mocktest.model.js');  // Assuming you have a MockTest model

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      // Changed from categories to category (singular)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    scheduled_class:{
      
      
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    courseDisplayName: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: false,
    },
    no_of_videos: {
      type: Number,
      required: false,
    },
    no_of_subjects: {
      type: Number,
      required: false,
    },
    no_of_notes: {
      type: Number,
      required: false,
    },
    successRate: {
      type: Number,
      required: false,
    },
    course_includes: [
      {
        type: String,
      },
    ],
    course_rating: {
      type: Number,
      default: 0,
    },
    student_feedback: [
      {
        student_ref: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student", // Reference to the Student model
        },
        review: {
          type: String,
        },
        rating: {
          type: Number,
        },
      },
    ],
    discountPrice: {
      type: Number,
      required: true,
    },
    live_class: {
      type: Boolean,
      default: false,
    },
    recorded_class: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
    },
    student_enrolled: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student", // Reference to the Student model
      },
    ],
    discountActive: {
      type: Boolean,
      default: false,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    mockTests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MockTest", // Reference to the MockTest model
      },
    ],
    image: {
      type: String, // URL of the course image
      required: true,
    },
    isKycRequired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

courseSchema.methods.calculateAverageRating = function () {
  if (!this.student_feedback.length) {
    this.rating = 0;
  } else {
    const total = this.student_feedback.reduce((sum, feedback) => sum + (feedback.rating || 0), 0);
    const avg = total / this.student_feedback.length;
    this.rating = Number(avg.toFixed(2)); // round to 2 decimals
  }
};



courseSchema.pre("save", function (next) {
  this.calculateAverageRating();
  this.no_of_subjects = this.subjects?.length || 0;
  this.student_enrolled = this.student_enrolled?.length || 0;
  next();
});

module.exports = mongoose.model("Course", courseSchema);
