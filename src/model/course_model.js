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
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    no_of_videos: {
      type: Number,
      required: true,
    },
    no_of_subjects: {
      type: Number,
      required: true,
    },
    no_of_notes: {
      type: Number,
      required: true,
    },
    successRate: {
      type: Number,
      required: true,
    },
    course_includes: [
      {
        type: String,
      },
    ],
    student_feedback: [
      {
        student_ref: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student", // Reference to the Student model
        },
        review: {
          type: String,
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
        ref: "Subject", // Reference to the Subject model
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
