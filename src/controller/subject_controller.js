const Subject = require("../model/subject_model.js");
const Course = require("../model/course_model.js");
const mockTests = require("../model/mocktest.js");
const notes = require("../model/notes_model.js");
const lectures = require("../model/lecturesModel.js");
const mongoose = require("mongoose");




// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
module.exports.createSubject = async (req, res) => {
  try {
    const {
      subjectName,
      vimeoShowcaseID,
      subjectDisplayName,
      description,
      notes,
      mockTests,
      courses,
      image,
      lectures
    } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ subjectName });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject with this name already exists",
      });
    }

    // Validate courses if provided

    const newSubject = new Subject({
      subjectName,
      vimeoShowcaseID,
      subjectDisplayName,
      description,
      notes: notes || [],
      mockTests: mockTests || [],
      courses: courses || [],
      image,
      lectures: lectures || [],
    });

    const savedSubject = await newSubject.save();
    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: savedSubject,
    });
  } catch (error) {
    console.error("Error creating subject:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating subject",
      error: error.message,
    });
  }
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
module.exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate("courses") // Only populate specific fields from Course
      .populate("notes", "mockTests")
      .populate("lectures", "lectureName duration videoUrl")
      .sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subjects",
      error: error.message,
    });
  }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Public
module.exports.getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const subject = await Subject.findById(id)
      .populate("courses")
      .populate("notes")
      .populate("lectures", "lectureName duration videoUrl description")
      .populate("mockTests");

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("Error fetching subject:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subject",
      error: error.message,
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
module.exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    // Validate courses if provided in update
    if (updatedData.courses && updatedData.courses.length > 0) {
      const validCourses = await Course.find({
        _id: { $in: updatedData.courses },
      });
      if (validCourses.length !== updatedData.courses.length) {
        return res.status(400).json({
          success: false,
          message: "Some courses are invalid",
        });
      }
    }

    const updatedSubject = await Subject.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
      runValidators: true, // Run model validators on update
    })
      .populate("courses")
      .populate("notes")
      .populate("mockTests")
      .populate("lectures", "lectureName duration videoUrl");

    if (!updatedSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: updatedSubject,
    });
  } catch (error) {
    console.error("Error updating subject:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating subject",
      error: error.message,
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
module.exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const deletedSubject = await Subject.findByIdAndDelete(id);

    if (!deletedSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
      data: {
        id: deletedSubject._id,
        name: deletedSubject.subjectName,
      },
    });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting subject",
      error: error.message,
    });
  }
};
