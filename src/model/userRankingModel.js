const mongoose = require('mongoose');

const userRankingSchema = new mongoose.Schema({
  mockTestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MockTest', 
    required: true 
  },
  subject: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject', 
    required: false 
  }, // Changed from courseId to subject
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  bestAttemptId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserAttempt', 
    required: true 
  },
  bestScore: { type: Number, required: true },
  rank: { type: Number, required: true },
  attemptsCount: { type: Number, required: true, min: 1, },
  lastUpdated: { type: Date, default: Date.now }
});

// Updated indexes
userRankingSchema.index({ mockTestId: 1, subject: 1, bestScore: -1 });
userRankingSchema.index({ userId: 1, mockTestId: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('UserRanking', userRankingSchema);