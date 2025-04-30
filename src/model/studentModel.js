const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isEnrolled: {
    type: Boolean,
    default: false,
  },
  courseRef: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],

  // image: { type: String, required: true },
});

module.exports = mongoose.model("Student", studentSchema);
