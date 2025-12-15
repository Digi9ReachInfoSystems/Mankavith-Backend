// services/notificationService.js
const User = require("../model/user_model");
const admin = require("../utils/firebaseAdmin");

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
