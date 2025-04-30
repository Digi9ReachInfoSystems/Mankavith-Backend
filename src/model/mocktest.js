// models/mocktest.model.js
const mongoose = require("mongoose");

const mockTestSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    duration: {
      type: String,
    },
    totalQuestions: {
      type: Number,
    },
    passingScore: {
      type: Number,
    },
    // Add other fields as needed
  },
  { timestamps: true }
);

module.exports = mongoose.model("MockTest", mockTestSchema);
