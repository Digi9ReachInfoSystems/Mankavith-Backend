const mongoose = require("mongoose");

const testimonialsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: String, required: true },
    description: { type: String, required: true },
    testimonial_image: { type: String, required: true },
},
{
    timestamps: true
});

module.exports = mongoose.model("Testimonials", testimonialsSchema);