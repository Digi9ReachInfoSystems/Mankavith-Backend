const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema({
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    },
    progress: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: ["ongoing", "completed"],
            default: "ongoing",
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
            default: Date.now,
        },
        completedPercentage: {
            type: Number,
            default: 0,
        },
        subjectProgress: [{
            subject_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Subject",
            },
            status: {
                type: String,
                enum: ["ongoing", "completed"],
                default: "ongoing",
            },
            completedPercentage: {
                type: Number,
                default: 0,
            },
            startedAt: {
                type: Date,
                default: Date.now,
            },
            completedAt: {
                type: Date,
                default: Date.now,
            },
            lecturerProgress: [{
                lecturer_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Lecturer",
                },
                startedAt: {
                    type: Date,
                    default: Date.now,
                },
                completedAt: {
                    type: Date,
                    default: Date.now,
                },
                status: {
                    type: String,
                    enum: ["ongoing", "completed"],
                    default: "ongoing",
                },
            }],
        }],
    }],

});

module.exports = mongoose.model("CourseProgress", courseProgressSchema);
