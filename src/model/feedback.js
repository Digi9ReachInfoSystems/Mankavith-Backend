const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: false },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: { type: String, required: true },
  review: { type: String, required: true },
  image: {
    type: String,
    required: false,
  },
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  courseRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  isappproved: {
    type: Boolean,
    default: false,
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
