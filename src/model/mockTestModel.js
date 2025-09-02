const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  marks: { type: Number, required: true } // Marks for this specific option
}, { _id: false });

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'subjective'], required: true },
  questionText: { type: String, required: true },
  isPassage: { type: Boolean, default: false },
  passageText: { type: String, required: false },
  options: {
    type: [optionSchema],
    required: function () { return this.type === 'mcq'; }
  },
  correctAnswer: {
    type: Number, // Now storing index of correct answer
    required: function () { return this.type === 'mcq'; }
  },
  expectedAnswer: { type: String }, // For subjective questions (optional)
  marks: { type: Number, required: true }
}, { _id: true });

const mockTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: false,  default: [] }], // Changed from courseId to subject
  duration: { type: Number, required: true, min: 1 }, // in minutes
  totalMarks: { type: Number, required: false },
  passingMarks: { type: Number, required: false },
  startDate: { type: Date, required: false ,default: null}, // Test availability window
  endDate: { type: Date, required: false ,default: null}, // null means no end date
  isActive: { type: Boolean, default: false },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  maxAttempts: { type: Number, default: 1 },
  isPublished: { type: Boolean, default: false },
   order: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
    students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
});

mockTestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MockTest', mockTestSchema);