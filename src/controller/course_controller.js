const Course = require('../model/course_model');
// const Subject = require('./subject.model.js');  // Assuming you have a Subject model
// const MockTest = require('./mocktest.model.js');  // Assuming you have a MockTest model

module.exports.createCourse = async (req, res) => {
    try {
        const { courseName, courseDisplayName, shortDescription, description, price, discountPrice, discountActive, subjects, mockTests, image } = req.body;

        // Ensure all subjects and mockTests are valid ObjectIds or valid references
        // const validSubjects = await Subject.find({ '_id': { $in: subjects } });
        // const validMockTests = await MockTest.find({ '_id': { $in: mockTests } });

        // if (validSubjects.length !== subjects.length) {
        //     return res.status(400).json({ success: false, message: 'Some subjects are invalid' });
        // }

        // if (validMockTests.length !== mockTests.length) {
        //     return res.status(400).json({ success: false, message: 'Some mock tests are invalid' });
        // }

        const newCourse = new Course({
            courseName,
            courseDisplayName,
            shortDescription,
            description,
            price,
            discountPrice,
            discountActive,
            subjects,
            mockTests,
            image,
        });

        const savedCourse = await newCourse.save();
        return res.status(201).json({ success: true, message: "Course created successfully", data: savedCourse });
    } catch (error) {
        console.error("Error creating course:", error);
        return res.status(500).json({ success: false, message: "Error creating course", error: error.message });
    }
};

// Get All Courses
module.exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            // .populate('subjects')  // Populating the subjects reference
            // .populate('mockTests');  // Populating the mockTests reference
        return res.status(200).json({ success: true, data: courses });
    } catch (error) {
        console.error("Error fetching courses:", error);
        return res.status(500).json({ success: false, message: "Error fetching courses", error: error.message });
    }
};

// Get Course by ID
module.exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id)
            // .populate('subjects')
            // .populate('mockTests');
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        return res.status(200).json({ success: true, data: course });
    } catch (error) {
        console.error("Error fetching course:", error);
        return res.status(500).json({ success: false, message: "Error fetching course", error: error.message });
    }
};

// Update Course
module.exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const updatedCourse = await Course.findByIdAndUpdate(id, updatedData, { new: true })
            // .populate('subjects')
            // .populate('mockTests');
        if (!updatedCourse) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        return res.status(200).json({ success: true, message: "Course updated successfully", data: updatedCourse });
    } catch (error) {
        console.error("Error updating course:", error);
        return res.status(500).json({ success: false, message: "Error updating course", error: error.message });
    }
};

// Delete Course
module.exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCourse = await Course.findByIdAndDelete(id);
        if (!deletedCourse) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        return res.status(200).json({ success: true, message: "Course deleted successfully" });
    } catch (error) {
        console.error("Error deleting course:", error);
        return res.status(500).json({ success: false, message: "Error deleting course", error: error.message });
    }
};
