const Notification = require('../model/notificationModel');
const User = require('../model/user_model');
const UserNotification = require('../model/userNotificationModel');
const mongoose = require('mongoose');
exports.sendNotification = async (req, res) => {
  try {
    const { title, description, time, image, notificationType } = req.body;

    const notification = new Notification({ title, description, time, image, notificationType });
    await notification.save();

    const users = await User.find();

    for (const user of users) {
      const userNotification = new UserNotification({
        title,
        description,
        time,
        image,
        user_ref: user._id,
      });
      await userNotification.save();

      const userIdentifier = user.displayName || user.email || user._id;
      console.log(`App notification created for user ${userIdentifier}`);
    }

    return res.status(200).json({ message: 'App notifications created successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating app notifications' });
  }
};

/**
 * Retrieve all app notifications for a given user.
 * Assumes you pass userId as a URL param or have req.user._id set via auth middleware.
//  */
exports.getUserNotifications = async (req, res) => {
  try {
    // const userId = req.params.userId || (req.user && req.user._id);
    const  userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const notifications = await UserNotification.find({ user_ref: userId })
      .sort({ created_on: -1 });

    return res.status(200).json({ notifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching notifications' });
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
