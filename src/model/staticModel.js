const mongoose = require("mongoose");

const StaticSchema = new mongoose.Schema({
    terms: { type: String, required: true },
    privacy: { type: String, required: true },

});

module.exports = mongoose.model("Static", StaticSchema);