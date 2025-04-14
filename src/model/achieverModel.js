const mongoose = require("mongoose");

const achieverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: String, required: true },
    // image: { type: String, required: true },
});

module.exports = mongoose.model("Achiever", achieverSchema);