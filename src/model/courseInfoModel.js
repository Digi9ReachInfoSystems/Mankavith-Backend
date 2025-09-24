const mongoose = require("mongoose");

const courseInfoSchema = new mongoose.Schema({
    content: { type: String, required: false }
});

module.exports = mongoose.model("CourseInfo", courseInfoSchema);