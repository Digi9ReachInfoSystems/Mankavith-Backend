// models/QuestionSet.js
const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
  {
    year: { type: String, required: true, min: 1900 },
    // description: { type: String, required: true, trim: true },
    question_url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const questionSetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true }, // e.g., "Maths"
    papers: { type: [paperSchema], default: [] },        // [{year, description, question_url}]
  },
  { timestamps: true }
);

// Optional: ensure title is unique across sets
questionSetSchema.index({ title: 1 }, { unique: true });

// Helper to enforce unique year per title at application level
questionSetSchema.methods.hasYear = function (y) {
  return this.papers.some(p => p.year === Number(y));
};

module.exports = mongoose.model("QuestionSet", questionSetSchema);
