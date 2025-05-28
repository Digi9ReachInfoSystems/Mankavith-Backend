const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  marks: { type: Number, required: true } // Marks for this specific option
}, { _id: false });

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'subjective'], required: true },
  questionText: { type: String, required: true },
  options: { 
    type: [optionSchema], 
    required: function() { return this.type === 'mcq'; } 
  },
  correctAnswer: { 
    type: Number, // Now storing index of correct answer
    required: function() { return this.type === 'mcq'; } 
  },
  expectedAnswer: { type: String }, // For subjective questions (optional)
  marks: { type: Number, required: true, min: 1 }
}, { _id: true });

const mockTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: {type:mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true}, // Changed from courseId to subject
  duration: { type: Number, required: true, min: 1 }, // in minutes
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  startDate: { type: Date, required: true }, // Test availability window
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  maxAttempts: { type: Number, default: 1 }
});

mockTestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MockTest', mockTestSchema);