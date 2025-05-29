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
exports.togglePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { publish } = req.body; // boolean

    // Validate test exists
    const test = await MockTest.findById(id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    // Additional validation checks before publishing
    if (publish) {
      if (test.questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot publish test with no questions'
        });
      }



      // Ensure all MCQ questions have correct answers
      const invalidQuestions = test.questions.filter(q =>
        q.type === 'mcq' && (q.correctAnswer === undefined || q.correctAnswer === null)
      );

      if (invalidQuestions.length > 0) {
        return res.status(400).json({
          success: false,
          message: `MCQ questions must have correct answers (${invalidQuestions.length} invalid)`
        });
      }
    }

    // Update publish status
    const updatedTest = await MockTest.findByIdAndUpdate(
      id,
      { isPublished: publish },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Mock test ${publish ? 'published' : 'unpublished'} successfully`,
      data: {
        isPublished: updatedTest.isPublished,
        title: updatedTest.title,
        _id: updatedTest._id
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getMockTestBysubjectId = async (req, res) => {
  try {
    const { subjectId } = req.params;
    if (!subjectId) {
      return res.status(404).json({
        success: false,
        message: 'subjectId is required'
      });
    }
    let tests = await MockTest.find({
      subject: subjectId,
      isPublished: true,
      isDeleted: false,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).populate("subject");
    console.log(tests, );
    tests=tests.map(test => {
      return {
        ...test._doc,
        number_of_questions:test.questions?.length,
        number_of_subjective_questions:test?.questions.filter(q => q.type === 'subjective')?.length||0,
        number_of_mcq_questions:test?.questions.filter(q => q.type === 'mcq')?.length||0
      }
    })
    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};




exports.editMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent certain fields from being updated
    const forbiddenUpdates = ['createdAt', '_id', 'questions._id'];
    forbiddenUpdates.forEach(field => delete updates[field]);

    // Validate test exists and user has permission to edit
    let existingTest = await MockTest.findById(id);
    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    // Additional permission check (example)
    // if (existingTest.createdBy.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to edit this test'
    //   });
    // }
    existingTest.title = updates.title || existingTest.title;
    existingTest.description = updates.description || existingTest.description;
    existingTest.subject = updates.subject || existingTest.subject;
    existingTest.duration = updates.duration || existingTest.duration;
    existingTest.totalMarks = updates.totalMarks || existingTest.totalMarks;
    existingTest.passingMarks = updates.passingMarks || existingTest.passingMarks;
    existingTest.startDate = updates.startDate || existingTest.startDate;
    existingTest.endDate = updates.endDate || existingTest.endDate;
    existingTest.isActive = updates.isActive || existingTest.isActive;
    existingTest.maxAttempts = updates.maxAttempts || existingTest.maxAttempts;
    existingTest.isPublished = updates.isPublished || existingTest.isPublished;
    if (updates.questions) {
      const existingQuestionsMap = new Map();
      existingTest.questions.forEach(q => existingQuestionsMap.set(q._id.toString(), q));


      const mergedQuestions = updates.questions.map(question => {
        if (!question._id) {
          return question; 
        }

        const existingQuestion = existingQuestionsMap.get(question._id.toString());

        if (existingQuestion) {
          return {
            ...existingQuestion.toObject(), 
            ...question 
          };
        }
        return question;
      });

      existingTest.questions = mergedQuestions;

      existingTest.totalMarks = mergedQuestions.reduce(
        (sum, question) => sum + question.marks, 0
      );
    }

    const updatedTest = await existingTest.save();
   

    res.status(200).json({
      success: true,
      message: 'Mock test updated successfully',
      data: updatedTest
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.softDeleteMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTest = await MockTest.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    res.status(200).json({
      success: true,
      message: 'Mock test deleted successfully',
      data: updatedTest
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
