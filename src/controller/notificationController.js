const Notification = require('../model/notificationModel');
const User = require('../model/user_model');
const UserNotification = require('../model/userNotificationModel');
const mongoose = require('mongoose');
const moment = require("moment-timezone");
exports.sendNotification = async (req, res) => {
  try {
    const { title, description, time, notificationType } = req.body;

    const notification = new Notification({
      title, description, time,
      // image,
      notificationType
    });
    await notification.save();
    const now = moment().tz("Asia/Kolkata").toDate();
    const users = await User.find({ role: 'user' });
    if (time == null || time < now) {
      for (const user of users) {
        const userNotification = new UserNotification({
          title,
          description,
          time,
          // image,
          user_ref: user._id,
          read: false
        });
        await userNotification.save();

        const userIdentifier = user.displayName || user.email || user._id;
        console.log(`App notification created for user ${userIdentifier}`);
      }
      return res.status(200).json({ message: 'App notifications created successfully' });

    } else {
      return res.status(200).json({ message: 'App notifications scheduled successfully' });
    }


  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating app notifications' });
  }
};



exports.getNotificationById = async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({ notification });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching notification' });
  }
};

/**
 * Retrieve all app notifications for a given user.
 * Assumes you pass userId as a URL param or have req.user._id set via auth middleware.
//  */
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    const notifications = await UserNotification.find({ user_ref: userId })
      .sort({ createdAt: -1 })  // use createdAt from timestamps
      .select('-__v');          // optional: clean up response

    return res.status(200).json(notifications); // ← Just send the array
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching notifications' });
  }
};



exports.clearUserNotification = async (req, res) => {
  const { userNotificationId } = req.params;

  // 1) Validate ID format
  if (!mongoose.Types.ObjectId.isValid(userNotificationId)) {
    return res.status(400).json({ message: "Invalid notification ID" });
  }

  try {
    // 2) Remove that one record
    const deleted = await UserNotification.findByIdAndDelete(userNotificationId);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "User notification not found" });
    }

    // 3) Success
    return res
      .status(200)
      .json({ message: "User notification cleared successfully" });
  } catch (err) {
    console.error("Error clearing user notification:", err);
    return res.status(500).json({ message: err.message });
  }
};



// controllers/notificationController.js

exports.markNotificationsAsRead = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid User ID' });
  }

  try {
    const result = await UserNotification.updateMany(
      { user_ref: userId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      message: `${result.modifiedCount} notification(s) marked as read`
    });
  } catch (err) {
    console.error("Error marking as read:", err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .select('-__v');

    return res.status(200).json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.bulkDeleteNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    let result = [];

    for (const notificationId of notificationIds) {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        result.push({ success: false, notificationId, message: "Notification not found" });
      } else {
        await Notification.findByIdAndDelete(notificationId);
        result.push({ success: true, notificationId, message: "Notification deleted successfully" });
      }
    }

    return res.status(200).json({ success: true, message: "Notifications deleted successfully", result });
  } catch (err) {
    console.error("Error deleting notifications:", err);
    return res.status(500).json({ message: 'Server error' });
  }
};
