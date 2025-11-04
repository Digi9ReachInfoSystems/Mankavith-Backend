const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema({
  certificate_url: {
    type: String,
    required: true,
  },
  course_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  user_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  courseName: { type: String },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Certificate", CertificateSchema);
