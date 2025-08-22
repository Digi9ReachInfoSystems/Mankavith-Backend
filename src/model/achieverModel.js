const mongoose = require("mongoose");

const achieverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: String, required: true },
    exam_name: { type: String, required: true },
    image: { type: String, required: true },
    sequence: { type: Number, required: true },
},
{
    timestamps: true
});

module.exports = mongoose.model("Achiever", achieverSchema);