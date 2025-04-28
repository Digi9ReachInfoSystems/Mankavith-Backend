const mongoose = require("mongoose");

const whySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
});

module.exports = mongoose.model("Why", whySchema);