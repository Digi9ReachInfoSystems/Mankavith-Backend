const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  course_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    // required: true,
  },
});

module.exports = mongoose.model("Banner", bannerSchema);
