const MockTest = require('../model/mockTestModel');
// const UserAttempt = require('../models/UserAttempt');
// const UserRanking = require('../models/UserRanking');

// Admin: Create a new mock test
exports.createMockTest = async (req, res) => {
  try {
    const { title, description, duration, passingMarks, questions, subject, startDate, endDate } = req.body;
    
    // Validate test window
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Calculate total marks
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    
    const mockTest = new MockTest({
      title,
      description,
      subject,
      duration,
      totalMarks,
      passingMarks,
      questions,
      startDate,
      endDate
    });
    
    await mockTest.save();
    
    res.status(201).json({
      success: true,
      data: mockTest
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Get all active mock tests
exports.getMockTests = async (req, res) => {
  try {
    // Get tests where user hasn't exhausted attempts
    const attemptedTests = await UserAttempt.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: "$mockTestId", count: { $sum: 1 } } },
      { $match: { count: { $lt: 3 } } }
    ]);
    
    const attemptedTestIds = attemptedTests.map(t => t._id);
    
    // Get all active tests excluding those where user has 3 attempts
    const tests = await MockTest.find({
      isActive: true,
      _id: { $nin: attemptedTestIds }
    });
    
    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get test details
exports.getMockTest = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id).populate("subject");
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: test
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getAllMockTests = async (req, res) => {
  try {
    const tests = await MockTest.find().populate("subject");
    
    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};