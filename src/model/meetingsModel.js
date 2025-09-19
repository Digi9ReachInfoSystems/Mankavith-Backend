const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  meeting_title: {
    type: String,
    required: true,
  },
  meeting_agenda: {
    type: String,
    required: true,
  },
  assistant_id: {
    type: String,
    required: false,
  },
  host_email: {
    type: String,
    required: true,
  },
  alternate_host_email: {
    type: String,
    required: false,
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
    type: Number,
    required: true,
  },

  zoom_meeting_id: { type: Number, required: true }, // plain integer ID
  zoom_passcode: { type: String, required: true },
  zoom_start_url: { type: String, required: true }, // host-only
  zoom_join_url: { type: String, required: true }, // share with students
  zoom_type: { type: String, required: true }, // 1, 2, 3, 8
  created_at: {
    type: Date,
    default: Date.now,
  },
  course_Ref: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  }],
  meeting_type: {
    type: String,
    required: true,
    enum: ["me", "other_host", "both"],
    default: "me"
  },
  isEnded: {
    type: Boolean,
    default: false,
  },
  hostIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }]
}, { timestamps: true });

module.exports = mongoose.model("Meeting", meetingSchema);
