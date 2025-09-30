const User = require("../model/user_model");
const UserProgress = require("../model/userProgressModel");
const Course = require("../model/course_model");
const Meeting = require("../model/meetingsModel");
const Notification = require("../model/notificationModel");
const UserNotification = require("../model/userNotificationModel");
const moment = require("moment-timezone");
exports.removeExpiredSubscriptions = async (req, res) => {
  const now = new Date();

  try {
    const users = await User.find({ "subscription.expires_at": { $lte: now } });
    let expiredCourseIds = [];
    for (let user of users) {
      expiredCourseIds = user.subscription.map((sub) => {
        if (sub.expires_at <= now) {
          return sub.course_enrolled;
        } else {
          return null;
        }
      });
      expiredCourseIds = expiredCourseIds.filter((id) => id !== null);

      user.subscription = user.subscription.filter(
        (sub) => sub.expires_at > now
      );

      await user.save();
      if (user.subscription.length > 0) {
        const userProgress = await UserProgress.findOne({ user_id: user._id });
        if (userProgress) {
          userProgress.courseProgress = userProgress.courseProgress.filter(
            (progress) => !expiredCourseIds.includes(progress.course_id)
          );
          await userProgress.save();
        }
      }
      console.log(
        `✅ Updated user ${user._id} - removed expired subscriptions`
      );
      expiredCourseIds.forEach(async (courseId) => {
        const course = await Course.findById(courseId);
        if (course) {
          course.student_enrolled = course.student_enrolled.filter(
            (studentId) => !studentId.equals(user._id)
          );
          await course.save();
        }
      });
    }
    res.json({ success: true, message: "Expired subscriptions removed" });
  } catch (err) {
    console.error(
      "❌ Error while removing expired subscriptions:",
      err.message
    );
  }
};




exports.cleanOldMeetings = async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await Meeting.deleteMany({
      meeting_time: { $lt: oneMonthAgo }
    });

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} meetings older than 1 month`
    });
  } catch (error) {
    console.error("Error cleaning old meetings:", error);
    return res.status(500).json({
      success: false,
      message: "Error cleaning old meetings",
      error: error.message
    });
  }
};

exports.sendScheduledNotifications = async (req, res) => {
  // await dbConnect();

  const now = moment().tz("Asia/Kolkata").toDate();

  // find due notifications
  const due = await Notification.find({
    time: { $lte: now },
    sent: false
  });

  if (!due.length) {
    return res.json({ dispatched: 0 });
  }

  for (const notif of due) {
    const users = await User.find({ role: "user" });

    for (const user of users) {
      await new UserNotification({
        title: notif.title,
        description: notif.description,
        time: notif.time,
        user_ref: user._id,
        read: false
      }).save();
    }

    notif.sent = true; // mark as dispatched
    await notif.save();
  }

  res.json({ dispatched: due.length });
}

exports.removeOldNotifications = async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 3);

    const result = await UserNotification.deleteMany({
      time: { $lt: oneMonthAgo },
      read: true
    });
    
    res.json({ deleted: true, count: result.deletedCount });
  } catch (err) {
    console.log(err);
  }

}