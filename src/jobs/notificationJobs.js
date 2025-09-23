const cron = require("node-cron");
const User = require("../model/user_model");
const Notification = require("../model/notificationModel");
const UserNotification = require("../model/userNotificationModel");
const moment = require("moment-timezone");
// Run job every night at 12:00 AM
exports.sendScheduledNotifications = cron.schedule("* * * * *", async () => {

// exports.removeExpiredSubscriptions = cron.schedule(
//   "*/10 * * * * *",
//   async () => {
    console.log("🔄 Running cron job: send Scheduled Notification");

     const now = moment().tz("Asia/Kolkata").toDate();

    try {
      const dueNotifications = await Notification.find({
      time: { $lte: now },
      sent: { $ne: true },
    });

    if (!dueNotifications.length) {
      return; // nothing to do
    }

    for (const notif of dueNotifications) {
      const users = await User.find({ role: "user" });

      for (const user of users) {
        await new UserNotification({
          title: notif.title,
          description: notif.description,
          time: notif.time,
          user_ref: user._id,
          read: false,
        }).save();
      }

      notif.sent = true;
      await notif.save();

      console.log(`✅ Notification "${notif.title}" dispatched to ${users.length} users`);
    }
    } catch (err) {
      console.error(
        "❌ Error while sending scheduled notifications:",
        err.message
      );
    }
  }
);

exports.removeOlderNotifications = cron.schedule("* * * * *", async () => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 3);

    const result = await UserNotification.deleteMany({
      time: { $lt: oneMonthAgo },
      read: true
    });

    console.log(`🗑️ Deleted ${result.deletedCount} notifications older than 3 month`);
  } catch (err) {
    console.error("Error cleaning old notifications:", err);
  }
});
