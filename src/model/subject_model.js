const mongoose = require("mongoose");

// Assuming that Notes, MockTest, and Course models are already defined
// const Note = require('./note.model.js');
// const MockTest = require('./mocktest.model.js');
const Course = require('./course_model'); // Assuming you have a Course model

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      unique: true,
    },
    vimeoShowcaseID: {
      type: String, // The Vimeo Showcase ID to be used
      required: false,
    },
    subjectDisplayName: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
        required: false,
      },
    ],
    notes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note",
        required: false,
      },
    ],
    mockTests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MockTest", // Reference to MockTest model
        required: false
      },
    ],
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course", // Reference to Course model
        required: false
      },
    ],
    image: {
      type: String, // URL of the subject image
     
      required: false
    },
  },
  { timestamps: true }
);

subjectSchema.post("save", async function (doc) {
  if (doc.courses?.length) {
    for (const courseId of doc.courses) {
      const course = await Course.findById(courseId);
      if (course) await course.save(); // triggers course pre-save hook
    }
  }
});

module.exports = mongoose.model("Subject", subjectSchema);
