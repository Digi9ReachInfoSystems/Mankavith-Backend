const Student = require("../model/studentModel");
const User = require("../model/user_model");
const mongoose = require("mongoose");

exports.createStudent = async (req, res) => {
    try {
        const{email, password, phone, name, role='user',} = req.body;
       
    } catch (error) {
        console.error("Error creating student:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error. Could not add student.",
            error: error.message,
        });
    }
};