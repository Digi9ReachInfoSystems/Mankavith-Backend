const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  meeting_title: {
    type: String,
    required: true,
  },
  meeting_url: {
    type: String,
    required: true,
  },
  meeting_time: {
    type: Date,
    required: true,
  },
  meeting_duration: {
    type: String,
    required: true,
  },
  course_Ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  zoom_meeting_id: { type: Number, required: true }, // plain integer ID
  zoom_passcode: { type: String, required: true },
  zoom_start_url: { type: String, required: true }, // host-only
  zoom_join_url: { type: String, required: true }, // share with students
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Meeting", meetingSchema);
