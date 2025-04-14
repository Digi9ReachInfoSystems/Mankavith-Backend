const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({

  
    title : { type: String, required: true },
    description: { type: String, required: true },
    // files : { type: String, required: true },
});

module.exports = mongoose.model("Exam", examSchema);