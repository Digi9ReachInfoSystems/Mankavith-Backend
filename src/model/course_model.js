const mongoose = require('mongoose');

// Assuming Subject and MockTest models are already defined and imported
// const Subject = require('./subject.model.js');  // Assuming you have a Subject model
// const MockTest = require('./mocktest.model.js');  // Assuming you have a MockTest model

const courseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        unique: true,
    },
    courseDisplayName: {
        type: String,
        required: true,
    },
    shortDescription: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    discountPrice: {
        type: Number,
        required: true,
    },
    discountActive: {
        type: Boolean,
        default: false,
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',  // Reference to the Subject model
    }],
    mockTests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MockTest',  // Reference to the MockTest model
    }],
    image: {
        type: String,  // URL of the course image
        required: true,
    }
}, { timestamps: true });


module.exports = mongoose.model('Course', courseSchema);;
