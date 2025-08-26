const mongoose = require("mongoose");

const userNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    time: { type: String, required: true },
    // image: { type: String, required: true },
    user_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    created_on: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false, // ← This is key: new notifications are unread by default
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserNotification", userNotificationSchema);
