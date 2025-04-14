const mongoose = require('mongoose');

// Assuming that Notes, MockTest, and Course models are already defined
// const Note = require('./note.model.js');
// const MockTest = require('./mocktest.model.js');
// const Course = require('./course.model.js'); // Assuming you have a Course model

const subjectSchema = new mongoose.Schema({
    subjectName: {
        type: String,
        required: true,
        unique: true,
    },
    vimeoShowcaseID: {
        type: String,  // The Vimeo Showcase ID to be used
        required: true,
    },
    subjectDisplayName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    notes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note', // Reference to Note model
    }],
    mockTests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MockTest', // Reference to MockTest model
    }],
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course', // Reference to Course model
    }],
    image: {
        type: String, // URL of the subject image
        required: true,
    }
}, { timestamps: true });


module.exports = mongoose.model('Subject', subjectSchema);
