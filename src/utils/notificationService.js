// services/notificationService.js
const User = require("../model/user_model");
const admin = require("../utils/firebaseAdmin");
const UserNotification = require('../model/userNotificationModel');
const mongoose = require('mongoose');
const moment = require("moment-timezone");
const Notification = require('../model/notificationModel');
exports.sendNotificationToUsers = async ({
  title,
  body,
  data = {},
  userIds
}) => {
  try {
    const users = await User.find({
      _id: { $in: userIds },
      "fcmTokens.0": { $exists: true }
    });

    if (!users.length) return;

    // 🔔 Save in-app notifications
    await User.updateMany(
      { _id: { $in: userIds } },
      {
        $push: {
          notifications: {
            title,
            body,
            data,
            isRead: false
          }
        }
      }
    );

    // 🔥 Collect tokens
    const tokens = users.flatMap(u =>
      u.fcmTokens.map(t => t.token)
    );

    const response = await admin.messaging().sendMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      )
    });

    // 🧹 Remove invalid tokens
    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[i]);
        }
      }
    });

    if (invalidTokens.length) {
      await User.updateMany(
        { "fcmTokens.token": { $in: invalidTokens } },
        { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
      );
    }
  } catch (err) {
    console.error("Notification error:", err);
  }
};


exports.sendCourseCreatedNotificationToUsers = async (course) => {
  try {
    // console.log("Sending course creation notifications...", course.courseDisplayName);
    const users = await User.find({ role: "user", fcmToken: { $exists: true }, isBlocked: false });

    if (!users.length) return;

    const title = "New Course Coming Soon!";
    const body = `Check out our upcoming course: ${course.courseDisplayName}`;
    // 🔔 Save in-app notification    s
    const now = moment().tz("Asia/Kolkata").toDate();
    const notification = new Notification({
      title, description: body, time: now,
      sent: true,
      // image,
      notificationType: "In-App",
    });
    for (const user of users) {
      const userNotification = new UserNotification({
        title,
        description: body,
        time: now,
        // image,
        user_ref: user._id,
        read: false
      });
      await userNotification.save();

    }
    // collect api tokens
    const tokens = users
      .map(user => {
        const tokensArray = user.fcmTokens;
        if (!tokensArray || tokensArray.length === 0) return null;

        // ✅ last inserted token
        return tokensArray[tokensArray.length - 1].token;
      })
      .filter(Boolean); // remove null/undefined

    //remove null tokens
    tokens = tokens.filter(t => t);

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        score: '850',
        time: '2:45'
      },
    });
  } catch (err) {
    console.error("Course creation notification error:", err);
  }
};