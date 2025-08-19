const MockTest = require("../model/mockTestModel");
const Subject = require("../model/subject_model");
// const UserAttempt = require('../models/UserAttempt');
// const UserRanking = require('../models/UserRanking');
const User = require("../model/user_model");
const Course = require("../model/course_model");
const UserAttempt = require("../model/userAttemptModel");
const UserRanking = require("../model/userRankingModel");
const mongoose = require("mongoose");

// Admin: Create a new mock test
exports.createMockTest = async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      passingMarks,
      questions,
      subject,
      startDate,
      endDate,
      maxAttempts,
    } = req.body;

    // Validate test window
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }
    let totalMarks = 0;
    // Calculate total marks
    if (questions?.length > 0) {
      totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    }

    const mockTest = new MockTest({
      title,
      description,
      subject,
      duration,
      totalMarks,
      passingMarks,
      questions,
      startDate,
      endDate,
      maxAttempts,
    });

    const savedTest = await mockTest.save();
    // await Subject.findByIdAndUpdate(
    //   subject,
    //   {
    //     $addToSet: { mockTests: savedTest._id },
    //     $setOnInsert: { mockTests: [] }
    //   },
    //   { upsert: true, new: true }
    // );
    await Promise.all(
      subject.map(async (sub) => {
        await Subject.findByIdAndUpdate(
          sub,
          { $push: { mockTests: savedTest._id } },
          { new: true }
        );
      })
    );
    // await Subject.findByIdAndUpdate(
    //   subject,
    //   { $push: { mockTests: savedTest._id } },
    //   { new: true }
    // );

    res.status(201).json({
      success: true,
      data: mockTest,
    });
  } catch (err) {
    console.log("Error creating mock test:", err);
    res.status(400).json({
      success: false,
      message: err.message,
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
      { $match: { count: { $lt: 3 } } },
    ]);

    const attemptedTestIds = attemptedTests.map((t) => t._id);

    // Get all active tests excluding those where user has 3 attempts
    const tests = await MockTest.find({
      isActive: true,
      _id: { $nin: attemptedTestIds },
    });

    res.status(200).json({
      success: true,
      data: tests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
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
        message: "Test not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...test._doc,
        number_of_questions: test.questions?.length,
        number_of_subjective_questions:
          test?.questions.filter((q) => q.type === "subjective")?.length || 0,
        number_of_mcq_questions:
          test?.questions.filter((q) => q.type === "mcq")?.length || 0,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllMockTests = async (req, res) => {
  try {
    const tests = await MockTest.find().populate("subject");

    res.status(200).json({
      success: true,
      data: tests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
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
        message: "Mock test not found",
      });
    }

    // Additional validation checks before publishing
    if (publish) {
      if (test.questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot publish test with no questions",
        });
      }

      // Ensure all MCQ questions have correct answers
      const invalidQuestions = test.questions.filter(
        (q) =>
          q.type === "mcq" &&
          (q.correctAnswer === undefined || q.correctAnswer === null)
      );

      if (invalidQuestions.length > 0) {
        return res.status(400).json({
          success: false,
          message: `MCQ questions must have correct answers (${invalidQuestions.length} invalid)`,
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
      message: `Mock test ${
        publish ? "published" : "unpublished"
      } successfully`,
      data: {
        isPublished: updatedTest.isPublished,
        title: updatedTest.title,
        _id: updatedTest._id,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMockTestBysubjectId = async (req, res) => {
  try {
    const { subjectId } = req.params;
    if (!subjectId) {
      return res.status(404).json({
        success: false,
        message: "subjectId is required",
      });
    }
    let tests = await MockTest.find({
      subject: subjectId,
      isPublished: true,
      isDeleted: false,
      $or: [
        {
          // Either: dates are within current range
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
        },
        {
          // Or: dates are null (both start and end)
          startDate: null,
          endDate: null,
        },
        {
          // Or: start date is null but end date is in future
          startDate: null,
          endDate: { $gte: new Date() },
        },
        {
          // Or: end date is null but start date is in past
          startDate: { $lte: new Date() },
          endDate: null,
        },
      ],
    }).populate("subject");
    console.log(tests);
    tests = tests.map((test) => {
      return {
        ...test._doc,
        number_of_questions: test.questions?.length,
        number_of_subjective_questions:
          test?.questions.filter((q) => q.type === "subjective")?.length || 0,
        number_of_mcq_questions:
          test?.questions.filter((q) => q.type === "mcq")?.length || 0,
      };
    });
    res.status(200).json({
      success: true,
      data: tests,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// exports.editMockTest = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = req.body;

//     // Prevent certain fields from being updated
//     const forbiddenUpdates = ['createdAt', '_id', 'questions._id'];
//     forbiddenUpdates.forEach(field => delete updates[field]);

//     // Validate test exists and user has permission to edit
//     let existingTest = await MockTest.findById(id);
//     if (!existingTest) {
//       return res.status(404).json({
//         success: false,
//         message: 'Mock test not found'
//       });
//     }
//     await Promise.all(existingTest.subject.map(async (subject) => {
//       const sub = await Subject.findById(subject);
//       await sub.updateOne({ $pull: { mockTests: id } });
//     }))
//     await Promise.all(updates.subject.map(async (subject) => {
//       const sub = await Subject.findById(subject);
//       await sub.updateOne({ $push: { mockTests: id } });
//     }))

//     // Additional permission check (example)
//     // if (existingTest.createdBy.toString() !== req.user.id) {
//     //   return res.status(403).json({
//     //     success: false,
//     //     message: 'Not authorized to edit this test'
//     //   });
//     // }
//     existingTest.title = updates.title || existingTest.title;
//     existingTest.description = updates.description || existingTest.description;
//     existingTest.subject = updates.subject || existingTest.subject;
//     existingTest.duration = updates.duration || existingTest.duration;
//     existingTest.totalMarks = updates.totalMarks || existingTest.totalMarks;
//     existingTest.passingMarks = updates.passingMarks || existingTest.passingMarks;
//     existingTest.startDate = updates.startDate || existingTest.startDate;
//     existingTest.endDate = updates.endDate || existingTest.endDate;
//     existingTest.isActive = updates.isActive || existingTest.isActive;
//     existingTest.maxAttempts = updates.maxAttempts || existingTest.maxAttempts;
//     existingTest.isPublished = updates.isPublished || existingTest.isPublished;
//     if (updates.questions) {
//       const existingQuestionsMap = new Map();
//       existingTest.questions.forEach(q => existingQuestionsMap.set(q._id.toString(), q));

//       const mergedQuestions = updates.questions.map(question => {
//         if (!question._id) {
//           return question;
//         }

//         const existingQuestion = existingQuestionsMap.get(question._id.toString());

//         if (existingQuestion) {
//           return {
//             ...existingQuestion.toObject(),
//             ...question
//           };
//         }
//         return question;
//       });

//       existingTest.questions = mergedQuestions;

//       existingTest.totalMarks = mergedQuestions.reduce(
//         (sum, question) => sum + question.marks, 0
//       );
//     }

//     const updatedTest = await existingTest.save();

//     res.status(200).json({
//       success: true,
//       message: 'Mock test updated successfully',
//       data: updatedTest
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };

exports.editMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    // Prevent certain fields from being updated
    const forbiddenUpdates = ["createdAt", "_id", "questions._id"];
    forbiddenUpdates.forEach((field) => delete updates[field]);

    // Load existing test
    let existingTest = await MockTest.findById(id);
    if (!existingTest) {
      return res
        .status(404)
        .json({ success: false, message: "Mock test not found" });
    }

    // ---- SUBJECTS: make optional & safe ----
    // Only touch subject backlinks if caller actually sent "subject" (even if empty array).
    const hasSubjectUpdate = Object.prototype.hasOwnProperty.call(
      updates,
      "subject"
    );

    if (hasSubjectUpdate) {
      // Normalize shapes to arrays of strings
      const normalizeIds = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.filter(Boolean).map(String);
        return [String(val)];
      };

      const currentSubjectIds = normalizeIds(existingTest.subject);
      const incomingSubjectIds = normalizeIds(updates.subject);

      // Compute diffs
      const currentSet = new Set(currentSubjectIds);
      const incomingSet = new Set(incomingSubjectIds);

      const toRemove = currentSubjectIds.filter((x) => !incomingSet.has(x));
      const toAdd = incomingSubjectIds.filter((x) => !currentSet.has(x));

      // Update backlinks
      if (toRemove.length) {
        await Subject.updateMany(
          { _id: { $in: toRemove } },
          { $pull: { mockTests: id } }
        );
      }
      if (toAdd.length) {
        await Subject.updateMany(
          { _id: { $in: toAdd } },
          { $addToSet: { mockTests: id } }
        );
      }

      // Persist subject on the mock test
      existingTest.subject = incomingSubjectIds;
    }

    // ---- BASIC FIELDS (use ?? so 0/false work) ----
    if ("title" in updates)
      existingTest.title = updates.title ?? existingTest.title;
    if ("description" in updates)
      existingTest.description =
        updates.description ?? existingTest.description;
    if ("duration" in updates)
      existingTest.duration = updates.duration ?? existingTest.duration;
    if ("totalMarks" in updates)
      existingTest.totalMarks = updates.totalMarks ?? existingTest.totalMarks;
    if ("passingMarks" in updates)
      existingTest.passingMarks =
        updates.passingMarks ?? existingTest.passingMarks;
    if ("isActive" in updates)
      existingTest.isActive = updates.isActive ?? existingTest.isActive;
    if ("maxAttempts" in updates)
      existingTest.maxAttempts =
        updates.maxAttempts ?? existingTest.maxAttempts;
    if ("isPublished" in updates)
      existingTest.isPublished =
        updates.isPublished ?? existingTest.isPublished;

    // ---- DATES are optional; only validate if both provided ----
    if ("startDate" in updates)
      existingTest.startDate = updates.startDate ?? existingTest.startDate;
    if ("endDate" in updates)
      existingTest.endDate = updates.endDate ?? existingTest.endDate;

    if (existingTest.startDate && existingTest.endDate) {
      const s = new Date(existingTest.startDate);
      const e = new Date(existingTest.endDate);
      if (isNaN(s) || isNaN(e)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid startDate or endDate format",
          });
      }
      if (s >= e) {
        return res
          .status(400)
          .json({
            success: false,
            message: "End date must be after start date",
          });
      }
    }

    // ---- QUESTIONS (optional merge logic) ----
    if (Array.isArray(updates.questions)) {
      const existingQuestionsMap = new Map();
      (existingTest.questions || []).forEach((q) =>
        existingQuestionsMap.set(String(q._id), q)
      );

      const mergedQuestions = updates.questions.map((q) => {
        if (!q._id) return q; // new question
        const prev = existingQuestionsMap.get(String(q._id));
        return prev ? { ...prev.toObject(), ...q } : q;
      });

      existingTest.questions = mergedQuestions;
      existingTest.totalMarks = mergedQuestions.reduce(
        (sum, q) => sum + Number(q.marks || 0),
        0
      );
    }

    const updatedTest = await existingTest.save();

    return res.status(200).json({
      success: true,
      message: "Mock test updated successfully",
      data: updatedTest,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.softDeleteMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTest = await MockTest.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Mock test deleted successfully",
      data: updatedTest,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addQuestionToMockTest = async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const question = req.body; // Expecting full question object

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res
        .status(404)
        .json({ success: false, message: "Mock test not found" });
    }

    mockTest.questions.push(question);
    mockTest.totalMarks += Number(question.marks);
    await mockTest.save();

    res
      .status(200)
      .json({ success: true, message: "Question added", mockTest });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ success: false, message: "Failed to add question" });
  }
};

exports.removeQuestionFromMockTest = async (req, res) => {
  try {
    const { mockTestId, questionId } = req.params;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res
        .status(404)
        .json({ success: false, message: "Mock test not found" });
    }

    const questionIndex = mockTest.questions.findIndex(
      (q) => q._id.toString() === questionId
    );
    if (questionIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    const removedQuestion = mockTest.questions[questionIndex];
    mockTest.totalMarks -= removedQuestion.marks;

    mockTest.questions.splice(questionIndex, 1);
    await mockTest.save();

    res
      .status(200)
      .json({ success: true, message: "Question removed", mockTest });
  } catch (error) {
    console.error("Error removing question:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove question" });
  }
};
exports.editQuestionInMockTest = async (req, res) => {
  try {
    const { mockTestId, questionId } = req.params;
    const updatedData = req.body;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res
        .status(404)
        .json({ success: false, message: "Mock test not found" });
    }

    const question = mockTest.questions.id(questionId);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    // If marks are being updated, adjust total marks
    if (
      updatedData.marks !== undefined &&
      updatedData.marks !== question.marks
    ) {
      mockTest.totalMarks =
        mockTest.totalMarks - question.marks + updatedData.marks;
    }

    // Update question fields
    Object.keys(updatedData).forEach((field) => {
      question[field] = updatedData[field];
    });

    await mockTest.save();

    res
      .status(200)
      .json({ success: true, message: "Question updated", question });
  } catch (error) {
    console.error("Error updating question:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update question" });
  }
};

exports.getAllUpcomingMockTests = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    let courseIds = await Promise.all(
      user.subscription.map(async (subscription) => {
        const course = await Course.findById(subscription.course_enrolled);
        if (course.isKycRequired) {
          if (
            user.kyc_status != "rejected" &&
            user.kyc_status != "not-applied"
          ) {
            return course._id;
          } else {
            return null;
          }
        } else {
          return course._id;
        }
      })
    );

    courseIds = courseIds.filter((course) => course !== null);
    const subjectIds = [];

    await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await Course.findById(courseId);
        if (course?.subjects) {
          course.subjects.forEach((subject) => {
            const idStr = subject.toString();
            if (!subjectIds.includes(idStr)) {
              subjectIds.push(idStr);
            }
          });
        }
      })
    );
    const tests = await MockTest.find({
      subject: { $in: subjectIds },
      startDate: { $gte: new Date() },
      isPublished: true,
    }).populate("subject");
    res.status(200).json({
      success: true,
      message: "upcoming mock tests fetched successfully",
      data: tests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};

exports.rearrangeQuestions = async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const { questions } = req.body;
    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res
        .status(404)
        .json({ success: false, message: "Mock test not found" });
    }
    mockTest.questions = questions;
    await mockTest.save();
    res
      .status(200)
      .json({ success: true, message: "Questions rearranged", mockTest });
  } catch (error) {
    console.error("Error rearranging questions:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to rearrange questions" });
  }
};

exports.deleteMockTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const mockTest = await MockTest.findById(id);
    if (!mockTest) {
      return res
        .status(404)
        .json({ success: false, message: "Mock test not found" });
    }
    const subject = await Subject.findById(mockTest.subject);
    if (subject) {
      if (subject.mockTests.length > 0) {
        subject.mockTests.pull(mockTest._id);
        await subject.save();
      }
    }

    await MockTest.findByIdAndDelete(id);
    const userRanking = await UserRanking.deleteMany({ mockTestId: id });
    const userAttempt = await UserAttempt.deleteMany({ mockTestId: id });
    const deleteMockTest = await MockTest.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Mock test deleted",
      deleteMockTest,
      userRanking,
      userAttempt,
    });
  } catch (error) {
    console.error("Error deleting mock test:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete mock test" });
  }
};

exports.bulkDeleteMocktests = async (req, res) => {
  try {
    const { mockTestIds } = req.body;

    if (
      !mockTestIds ||
      !Array.isArray(mockTestIds) ||
      mockTestIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No mock test IDs provided",
      });
    }

    let results = [];

    for (const id of mockTestIds) {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          results.push({
            id,
            success: false,
            message: "Invalid mock test ID",
          });
          continue;
        }

        const deletedMockTest = await MockTest.findByIdAndDelete(id);

        if (!deletedMockTest) {
          results.push({
            id,
            success: false,
            message: "Mock test not found",
          });
        } else {
          results.push({
            id: deletedMockTest._id,
            success: true,
            message: "Mock test deleted successfully",
          });
        }
      } catch (error) {
        console.error(`Error deleting mock test ${id}:`, error.message);
        results.push({
          id,
          success: false,
          message: "Error deleting mock test",
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Mock tests processed for deletion",
      results,
    });
  } catch (error) {
    console.error("Fatal error in bulkDeleteMocktests:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during mock test deletion",
      error: error.message,
    });
  }
};

exports.getMocktestsBySubjectName = async (req, res) => {
  try {
    const { subjectname } = req.params;

    if (!subjectname || typeof subjectname !== "string") {
      return res.status(400).json({
        success: false,
        message: "Subject name is required and must be a string.",
      });
    }

    // Find subject(s) by name (case-insensitive)
    const subjects = await Subject.find({
      subjectName: { $regex: new RegExp(subjectname, "i") },
    });

    if (!subjects || subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No subjects found matching name '${subjectname}'.`,
      });
    }

    // Extract subject IDs
    const subjectIds = subjects.map((sub) => sub._id);

    // Find mock tests linked to these subjects
    const mocktests = await MockTest.find({ subject: { $in: subjectIds } })
      .populate("subject")
      .populate("students"); // Now valid

    return res.status(200).json({
      success: true,
      message: `Mock tests for subject '${subjectname}' fetched successfully.`,
      count: mocktests.length,
      data: mocktests,
    });
  } catch (error) {
    console.error("Error fetching mock tests by subject name:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching mock tests.",
      error: error.message,
    });
  }
};

module.exports.rearrangeMocktest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { mocktestIds } = req.body;

    // Validate input
    if (
      !mocktestIds ||
      !Array.isArray(mocktestIds) ||
      mocktestIds.length === 0
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Mock test IDs array is required",
      });
    }

    // Validate ObjectIds
    const invalidIds = mocktestIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid mock test IDs found",
        invalidIds,
      });
    }

    // Prepare bulk operations
    const bulkOps = mocktestIds.map((id, index) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { order: index + 1 } },
      },
    }));

    // Execute bulk write
    const MockTest = mongoose.model("MockTest");
    const result = await MockTest.bulkWrite(bulkOps, { session });

    // Verify all updates were successful
    if (result.matchedCount !== mocktestIds.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Some mock tests not found",
        found: result.matchedCount,
        requested: mocktestIds.length,
        missing: mocktestIds.length - result.matchedCount,
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Mock tests reordered successfully",
      data: {
        updatedCount: result.modifiedCount,
        newOrder: mocktestIds.map((id, index) => ({
          mocktestId: id,
          position: index + 1,
        })),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error reordering mock tests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reorder mock tests",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
