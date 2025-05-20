const Student = require("../model/studentModel");
const User = require("../model/user_model");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

exports.createStudent = async (req, res) => {
    try {
        const { email, password, phone, name, role = 'user', photo_url } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
            phone,
            displayName: name,
            role,
            photo_url,
            isEmailVerified: true,
        });
        await user.save();
        const student = new Student({
            userRef: user._id,
        })
        await student.save();
        res
            .status(200)
            .json({ success: true, message: "Student created successfully", user, student });

    } catch (error) {
        console.error("Error creating student:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error. Could not add student.",
            error: error.message,
        });
    }
};

exports.editStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);
        if (!student) {
            return res
                .status(404)
                .json({ success: false, message: "Student not found" });
        }
        const user = await User.findById(student.userRef);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        user.email = req.body.email || user.email
        user.password = user.password;
        user.phone = req.body.phone || user.phone;
        user.displayName = req.body.name || user.displayName;
        user.role = user.role;
        user.photo_url = req.body.photo_url || user.photo_url;
        await user.save();
        await student.save();
        res
            .status(200)
            .json({ success: true, message: "Student updated successfully", user, student });
    } catch (error) {
        console.error("Error updating student:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error. Could not update student.",
            error: error.message,
        });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().populate("userRef");
        res
            .status(200)
            .json({ success: true, message: "Students fetched successfully", students });
    } catch (error) {
        console.error("Error fetching students:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error. Could not fetch students.",
            error: error.message,
        });
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const { studentId } = req.params
        const student = await Student.findById(studentId).populate("userRef");
        if (!student) {
            return res
                .status(404)
                .json({ success: false, message: "Student not found" });
        }
        res
            .status(200)
            .json({ success: true, message: "Student fetched successfully", student });
    } catch (error) {
        console.error("Error fetching student:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error. Could not fetch student.",
            error: error.message,
        });
    }
};

exports.deleteStudentById = async (req, res) => {
    try {
        const { studentId } = req.params;
        console.log("studentId", studentId)
        const student = await Student.findByIdAndDelete(studentId);
        console.log("student", student)
        const user = await User.findByIdAndDelete(student.userRef);
        if (!student) {
            return res
                .status(404)
                .json({ success: false, message: "Student not found" });
        }
        res
            .status(200)
            .json({ success: true, message: "Student deleted successfully" });
    } catch (error) {
        console.error("Error deleting student:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error. Could not delete student.",
            error: error.message,
        });
    }
};

exports.getTotalStudents = async (req, res) => {
    try {
        const count = await Student.countDocuments();
        return res.status(200).json({
            success: true,
            count: count,  // Changed from 'data' to 'count' for clarity
        });
    } catch (error) {
        console.error("Error fetching number of students:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error. Could not fetch number of students.",
            error: error.message,
        });
    }
};