const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

   
    title : { type: String, required: true },
    year: { type: String, required: true },
    description: { type: String, required: true },
    question_url : { type: String, required: true },    
    });

    module.exports = mongoose.model("Question", questionSchema);