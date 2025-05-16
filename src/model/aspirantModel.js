const mongoose = require("mongoose");

const aspirantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    exam_details: { type: String, required: true },
    image: { type: String, required: true },
},
{
    timestamps: true
});
