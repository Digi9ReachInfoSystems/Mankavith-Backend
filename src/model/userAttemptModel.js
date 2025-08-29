const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  answer: { type: String, default: '' },
  answerIndex: { type: Number }, // For MCQ, store the selected option index
  isCorrect: { type: Boolean, default: false },
  marksAwarded: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['answered', 'not-answered','not-answered-marked-for-review', 'answered-marked-for-review', 'unattempted'],
    default: 'unattempted'
  },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const userAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mockTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }, // Changed from courseId to subject
  attemptNumber: { type: Number, required: true, min: 1 },
  startedAt: { type: Date, default: Date.now },
  lastSavedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  evaluatedAt: { type: Date },
  answers: [answerSchema],
  mcqScore: { type: Number, default: 0 },
  subjectiveScore: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'evaluating', 'evaluated'],
    default: 'in-progress'
  },
  isBestAttempt: { type: Boolean, default: false },
  isWithinTestWindow: {
    type: Boolean,
    default: function () {
      // Calculate if the attempt is within test window at creation time
      return this.startedAt >= this.mockTest.startDate &&
        this.startedAt <= this.mockTest.endDate;
    }
  },
  timeSpent: { type: String, default: "0",
    
  } // store total time spent in seconds

});

// Updated indexes
userAttemptSchema.index({ userId: 1, mockTestId: 1, subject: 1 });
userAttemptSchema.index({ subject: 1, mockTestId: 1, status: 1 });
userAttemptSchema.index({ isBestAttempt: 1 });

module.exports = mongoose.model('UserAttempt', userAttemptSchema);