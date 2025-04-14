const Subject = require('../model/subject_model.js');
// const Note = require('./note.model.js');  // Assuming Note model exists
// const MockTest = require('./mocktest.model.js');  // Assuming MockTest model exists
const Course = require('../model/course_model.js');  // Assuming Course model exists

// Create Subject
module.exports.createSubject = async (req, res) => {
    try {
        const { subjectName, vimeoShowcaseID, subjectDisplayName, description, notes, mockTests, courses, image } = req.body;

        // Validate Notes, MockTests, and Courses are valid ObjectIds or existing references
        // const validNotes = await Note.find({ '_id': { $in: notes } });
        // const validMockTests = await MockTest.find({ '_id': { $in: mockTests } });
        // const validCourses = await Course.find({ '_id': { $in: courses } });

        // if (validNotes.length !== notes.length) {
        //     return res.status(400).json({ success: false, message: 'Some notes are invalid' });
        // }

        // if (validMockTests.length !== mockTests.length) {
        //     return res.status(400).json({ success: false, message: 'Some mock tests are invalid' });
        // }

        // if (validCourses.length !== courses.length) {
        //     return res.status(400).json({ success: false, message: 'Some courses are invalid' });
        // }

        const newSubject = new Subject({
            subjectName,
            vimeoShowcaseID,
            subjectDisplayName,
            description,
            notes,
            mockTests,
            courses,
            image
        });

        const savedSubject = await newSubject.save();
        return res.status(201).json({ success: true, message: 'Subject created successfully', data: savedSubject });
    } catch (error) {
        console.error("Error creating subject:", error);
        return res.status(500).json({ success: false, message: 'Error creating subject', error: error.message });
    }
};

// Get All Subjects
module.exports.getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find()
            // .populate('notes')
            // .populate('mockTests')
            .populate('courses');
        return res.status(200).json({ success: true, data: subjects });
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return res.status(500).json({ success: false, message: 'Error fetching subjects', error: error.message });
    }
};

// Get Subject by ID
module.exports.getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findById(id)
            // .populate('notes')
            // .populate('mockTests')
            .populate('courses');
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        return res.status(200).json({ success: true, data: subject });
    } catch (error) {
        console.error("Error fetching subject:", error);
        return res.status(500).json({ success: false, message: 'Error fetching subject', error: error.message });
    }
};

// Update Subject
module.exports.updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Validate Notes, MockTests, and Courses references
        // const validNotes = await Note.find({ '_id': { $in: updatedData.notes } });
        // const validMockTests = await MockTest.find({ '_id': { $in: updatedData.mockTests } });
        // const validCourses = await Course.find({ '_id': { $in: updatedData.courses } });

        // if (validNotes.length !== updatedData.notes.length) {
        //     return res.status(400).json({ success: false, message: 'Some notes are invalid' });
        // }

        // if (validMockTests.length !== updatedData.mockTests.length) {
        //     return res.status(400).json({ success: false, message: 'Some mock tests are invalid' });
        // }

        // if (validCourses.length !== updatedData.courses.length) {
        //     return res.status(400).json({ success: false, message: 'Some courses are invalid' });
        // }

        const updatedSubject = await Subject.findByIdAndUpdate(id, updatedData, { new: true })
            // .populate('notes')
            // .populate('mockTests')
            .populate('courses');
        if (!updatedSubject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        return res.status(200).json({ success: true, message: 'Subject updated successfully', data: updatedSubject });
    } catch (error) {
        console.error("Error updating subject:", error);
        return res.status(500).json({ success: false, message: 'Error updating subject', error: error.message });
    }
};

// Delete Subject
module.exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSubject = await Subject.findByIdAndDelete(id);
        if (!deletedSubject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        return res.status(200).json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
        console.error("Error deleting subject:", error);
        return res.status(500).json({ success: false, message: 'Error deleting subject', error: error.message });
    }
};
