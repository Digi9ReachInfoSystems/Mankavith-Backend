const mongoose = require("mongoose");

const userProgressSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    courseProgress: [{
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
        },
        status: {
            type: String,
            enum: ["ongoing", "completed"],
            default: "ongoing",
        },
        viewedCertificate: {
            type: Boolean,
            default: false,
        },
        generatedCertificate: {
            type: Boolean,
            default: false,
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
            }],
        }],
    }],

});

module.exports = mongoose.model("UserProgress", userProgressSchema);
