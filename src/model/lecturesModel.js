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
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    // courseRef: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Course",
    // },
    // subjectRef: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Subject",
    // },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lecture", LectureSchema);
