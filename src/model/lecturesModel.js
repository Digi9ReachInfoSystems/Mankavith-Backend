const mongoose = require("mongoose");

const LectureSchema = new mongoose.Schema(
  {
    lectureName: {
      type: String,
      required: false,
    },
    description: {
      type: String,
    },
    duration: {
      type: String,
      required: false,
    },
    videoUrl: {
      type: String,
      required: false,
    },
    thumbnail: {
      type: String,
      required: false,
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
