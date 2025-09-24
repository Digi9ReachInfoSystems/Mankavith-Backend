const CourseInfo = require("../model/courseInfoModel");
const mongoose = require("mongoose");


exports.create = async (req, res) => {
    try {
        const { content } = req.body;
        const courseInfo = await CourseInfo.create({
            content
        });
        res.status(201).json({sucess: true, message: "courseInfo created successfully", data: courseInfo });
    } catch (error) {
        res.status(400).json({success: false, error: error.message });
    }
};

exports.get = async (req, res) => {
    try {
        const courseInfo = await CourseInfo.findOne({});
        res.status(200).json({success: true, data: courseInfo });
    } catch (error) {
        res.status(400).json({success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { content } = req.body;
        const courseInfo = await CourseInfo.findOneAndUpdate({}, { content }, { new: true });
        res.status(200).json({success: true, message: "courseInfo updated successfully", data: courseInfo });
    } catch (error) {
        res.status(400).json({success: false, error: error.message });
    }
}