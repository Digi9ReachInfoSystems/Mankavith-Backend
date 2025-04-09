const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

    exam:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    title : { type: String, required: true }
    });

    module.exports = mongoose.model("Question", questionSchema);