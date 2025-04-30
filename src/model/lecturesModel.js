const mongoose = require("mongoose");

const LectureSchema = new mongoose.Schema(
  {
    lectureName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    duration: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    courseRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lecture", LectureSchema);
