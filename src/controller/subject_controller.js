const Subject = require("../model/subject_model.js");
const Course = require("../model/course_model.js");
// const mockTests = require("../model/mocktest.js");
const notes = require("../model/notes_model.js");
const Lecture = require("../model/lecturesModel.js");
const mongoose = require("mongoose");
const { applyTimestamps } = require("../model/courseProgressModel.js");
const Note = require("../model/notes_model.js");
const MockTest = require("../model/mockTestModel.js"); 




// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
module.exports.createSubject = async (req, res) => {
  try {
    // extract only subjectName for the required check
    const { subjectName } = req.body;
    if (!subjectName || typeof subjectName !== 'string' || !subjectName.trim()) {
      return res.status(400).json({
        success: false,
        message: "subjectName is required",
      });
    }

    // now pull in all other fields as optional, with defaults where appropriate
    const {
      vimeoShowcaseID = null,
      subjectDisplayName = '',
      description = '',
      notes = [],
      mockTests = [],
      courses = [],
      image = null,
      lectures = [],
    } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ subjectName });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject with this name already exists",
      });
    }

    const newSubject = new Subject({
      subjectName,
      vimeoShowcaseID,
      subjectDisplayName,
      description,
      notes,
      mockTests,
      courses,
      image,
      lectures,
    });

    const savedSubject = await newSubject.save();
    await Promise.all(
      savedSubject.courses.map(async (courseId) => {
        const course = await Course.findById(courseId);
        if (!course) {
          return;
        }
        course.subjects.push(savedSubject._id);
        await course.save();
      })
    );
    await Promise.all(
      savedSubject.notes.map(async (noteId) => {
        const note = await Note.findById(noteId);
        if (!note) {
          return;
        }
        note.subjects.push(savedSubject._id);
        await note.save();
      })
    );
    await Promise.all(
      savedSubject.lectures.map(async (lectureId) => {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
          return;
        }
        lecture.subjectRef.push(savedSubject._id);
        await lecture.save();
      })
    );
    await Promise.all(
      savedSubject.mockTests.map(async (mockTestId) => {
        const mockTest = await MockTest.findById(mockTestId);
        if (!mockTest) {
          return;
        }
        mockTest.subject.push(savedSubject._id);
        await mockTest.save();
      })
    );

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
      .populate("notes")
      .populate("lectures")
      .populate("mockTests")
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

    let subject = await Subject.findById(id)
      .populate("courses")
      .populate("notes")
      .populate("lectures", "lectureName duration videoUrl description")
      .populate("mockTests");

    const mockTests = subject.mockTests.map(test => {

      const number_of_questions = test.questions?.length;
      const number_of_subjective_questions = test?.questions.filter(q => q.type === 'subjective')?.length || 0;
      const number_of_mcq_questions = test?.questions.filter(q => q.type === 'mcq')?.length || 0;
      //  console.log("test",test  );
      return ({
        ...test._doc,
        number_of_questions,
        number_of_subjective_questions,
        number_of_mcq_questions
      });
    })
    const temp = { ...subject._doc };
    temp.mockTests = mockTests;

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: temp,
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
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }
    await Promise.all(
      subject.courses.map(async (courseId) => {
        const course = await Course.findById(courseId);
        if (!course) {
          return;
        }
        course.subjects.pull(id);
        await course.save();
      })
    );
    await Promise.all(
      updatedData.courses.map(async (courseId) => {
        const course = await Course.findById(courseId);
        if (!course) {
          return;
        }
        course.subjects.push(subject._id);
        await course.save();
      })
    );
    await Promise.all(
      subject.notes.map(async (noteId) => {
        const note = await Note.findById(noteId);
        if (!note) {
          return;
        }
        note.subjects.pull(id);
        await note.save();
      })
    );
    await Promise.all(
      updatedData.notes.map(async (noteId) => {
        const note = await Note.findById(noteId);
        if (!note) {
          return;
        }
        note.subjects.push(subject._id);
        await note.save();
      })
    );
    await Promise.all(
      subject.lectures.map(async (lectureId) => {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
          return;
        }
        lecture.subjectRef.pull(id);
        await lecture.save();
      })
    );
    await Promise.all(
      updatedData.lectures.map(async (lectureId) => {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
          return;
        }
        lecture.subjectRef.push(subject._id);
        await lecture.save();
      })
    );
    await Promise.all(
      subject.mockTests.map(async (mockId) => {
        const mock = await MockTest.findById(mockId);
        if (!mock) {
          return;
        }
        mock.subject.pull(id);
        await mock.save();
      })
    );
    await Promise.all(
      updatedData.mockTests.map(async (mockId) => {
        const mock = await MockTest.findById(mockId);
        if (!mock) {
          return;
        }
        mock.subject.push(subject._id);
        await mock.save();
      })
    );

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
      // runValidators: true, // Run model validators on update
    })
    // .populate("courses")
    // .populate("notes")
    // .populate("mockTests")
    // .populate("lectures");

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

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }
    await Promise.all(
      subject.courses.map(async (courseId) => {
        const course = await Course.findById(courseId);
        if (!course) {
          return; // If course not found, skip to the next iteration    
        }
        course.subjects.pull(id);
        await course.save();
      })
    );
    await Promise.all(
      subject.notes.map(async (noteId) => {
        const note = await Note.findById(noteId);
        if (!note) {
          return;
        }
        note.subjects.pull(id);
        await note.save();
      })
    );
    await Promise.all(
      subject.lectures.map(async (lectureId) => {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
          return;
        }
        lecture.subjectRef.pull(id);
        await lecture.save();
      })
    );


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

exports.getNoOfSubjects = async (req, res) => {
  try {
    const count = await Subject.countDocuments();
    return res.status(200).json({
      success: true,
      count: count,  // Changed from 'data' to 'count' for clarity
    });
  } catch (error) {
    console.error("Error fetching number of courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch number of courses.",
      error: error.message,
    });
  }
};

module.exports.bulkDeleteSubjects = async (req, res) => {
  try {
    const { subjectIds } = req.body;
    if (subjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No subject IDs provided",
      });
    }
    let results = [];
    for (const id of subjectIds) {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid subject ID",
          });
        }

        const subject = await Subject.findById(id);
        if (!subject) {
          return res.status(404).json({
            success: false,
            message: "Subject not found",
          });
        }
        await Promise.all(
          subject.courses.map(async (courseId) => {
            const course = await Course.findById(courseId);
            if (!course) {
              return;
            }
            course.subjects.pull(id);
            await course.save();
          })
        );
        await Promise.all(
          subject.notes.map(async (noteId) => {
            const note = await Note.findById(noteId);
            if (!note) {
              return;
            }
            note.subjects.pull(id);
            await note.save();
          })
        );
        await Promise.all(
          subject.lectures.map(async (lectureId) => {
            const lecture = await Lecture.findById(lectureId);
            if (!lecture) {
              return;
            }
            lecture.subjectRef.pull(id);
            await lecture.save();
          })
        );


        const deletedSubject = await Subject.findByIdAndDelete(id);

        if (!deletedSubject) {
          return res.status(404).json({
            success: false,
            message: "Subject not found",
          });
        }

        results.push({
          id: deletedSubject._id,
          success: true,
          message: "Subject deleted successfully",
          data: deletedSubject,
        });

      } catch (error) {
        console.error("Error deleting subject:", error.message);
        results.push({
          id: id,
          success: false,
          message: "Error deleting subject",
          error: error.message,
          error
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Subjects deleted successfully",
      data: results,
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