const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true }
    });

    module.exports = mongoose.model("Content", contentSchema);