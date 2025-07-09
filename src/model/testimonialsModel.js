const mongoose = require("mongoose");

const testimonialsSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  rank:           { type: String, required: true },
  description:    { type: String, required: true },
  testimonial_image: { type: String }, // optional URL or path to image
  testimonial_video: { type: String }, // optional URL or path to video
}, {
  timestamps: true
});

// Ensure exactly one of image or video is provided:
testimonialsSchema.pre('validate', function(next) {
  const hasImage = !!this.testimonial_image;
  const hasVideo = !!this.testimonial_video;

  if (hasImage === hasVideo) {
    // either both are set or both are empty
    return next(new Error(
      'Please provide exactly one of testimonial_image or testimonial_video'
    ));
  }
  next();
});

module.exports = mongoose.model("Testimonials", testimonialsSchema);
