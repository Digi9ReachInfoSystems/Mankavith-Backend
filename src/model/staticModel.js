const mongoose = require("mongoose");

const StaticSchema = new mongoose.Schema({
    terms: { type: String, required: false },
    privacy: { type: String, required: false },
    refund: { type: String, required: false },

});

module.exports = mongoose.model("Static", StaticSchema);