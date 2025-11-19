const User = require("../model/user_model");
const UserProgress = require("../model/userProgressModel");
const Course = require("../model/course_model");
const Meeting = require("../model/meetingsModel");
const Notification = require("../model/notificationModel");
const UserNotification = require("../model/userNotificationModel");
const MockTest = require("../model/mockTestModel");
const UserAttempt = require("../model/userAttemptModel");
const UserRankings = require("../model/userRankingModel");
const Subject = require("../model/subject_model");
const moment = require("moment-timezone");
const Certificate = require("../model/certificatesModel");
exports.removeExpiredSubscriptions = async (req, res) => {
  console.log("Running removeExpiredSubscriptions job");

  const now = moment.tz("Asia/Kolkata").toDate();
  console.log("Current time (IST):", now);

  try {
    const users = await User.find({
      subscription: {
        $elemMatch: { expires_at: { $lte: now } },
      },
    });
    console.log(`Found ${users.length} users with expired subscriptions`, users.map(u => u._id));
    let expiredCourseIds = [];
    for (let user of users) {
      // Filter out expired subscriptions
      expiredCourseIds = user.subscription.map((sub) => {
        if (sub.expires_at <= now) {
          return sub.course_enrolled;
        } else {
          return null;
        }
      });
      console.log("expiredCourseIds", expiredCourseIds);
      expiredCourseIds = expiredCourseIds.filter((id) => id !== null);
      // console.log("expiredCourseIds", expiredCourseIds);

      let nonExpiredCourseIds = [];
      nonExpiredCourseIds = user.subscription.map((sub) => {
        if (sub.expires_at > now) {
          return sub.course_enrolled;
        } else {
          return null;
        }
      });
      nonExpiredCourseIds = nonExpiredCourseIds.filter((id) => id !== null);

      //get subjects in expiredCourseIds
      const subjectsInExpiredCourses = await Subject.find({
        courses: { $in: expiredCourseIds },
      }).select("_id");

      //get subjects in nonExpiredCourseIds
      const subjectsInNonExpiredCourses = await Subject.find({
        courses: { $in: nonExpiredCourseIds },
      }).select("_id");

      //get subjects in expiredCourseIds and not in nonExpiredCourseIds
      let subjectsToDeactivate = [];
      subjectsToDeactivate = subjectsInExpiredCourses.filter(
        (sub) =>
          !subjectsInNonExpiredCourses.some((nsub) => nsub._id.equals(sub._id))
      );
      // console.log("subjectsToDeactivate", subjectsToDeactivate);

      subjectsToDeactivate = subjectsToDeactivate.map((sub) => sub._id);




      //get mocktests in expiredCourseIds and not in nonExpiredCourseIds
      const mockTestsToDeactivate = await MockTest.find({
        subject: { $in: subjectsToDeactivate },
      });
      // console.log("mockTestsToDeactivate", mockTestsToDeactivate);
      //remove user attempts for mockTestsToDeactivate
      for (let mt of mockTestsToDeactivate) {
        await UserAttempt.deleteMany({ userId: user._id, mockTestId: mt._id });
        console.log(
          `🗑️ Deleted attempts for user ${user._id} for mock test ${mt._id}`
        );
      }

      //remove user rankings for mockTestsToDeactivate
      for (let mt of mockTestsToDeactivate) {
        await UserRankings.deleteMany({ userId: user._id, mockTestId: mt._id });
        console.log(
          `🗑️ Deleted rankings for user ${user._id} for mock test ${mt._id}`
        );
      }



      user.subscription = user.subscription.filter(
        (sub) => sub.expires_at > now
      );

      await user.save();
      if (user.subscription.length > 0) {
        const userProgress = await UserProgress.findOne({
          user_id: user._id,
        });
        // console.log("userProgress", userProgress);
        if (userProgress) {
          userProgress.courseProgress = userProgress.courseProgress.filter(progress => {
            const isExpired = expiredCourseIds
              .map(id => id.toString())
              .includes(progress.course_id.toString());

            return !isExpired;
          });
          console.log("Updated courseProgress", userProgress.courseProgress);
          await userProgress.save();
        }
      }
      expiredCourseIds.forEach(async (courseId) => {
        const course = await Course.findById(courseId);
        if (course) {
          course.student_enrolled = course.student_enrolled.filter(
            (studentId) => !studentId.equals(user._id)
          );
          const certificates = await Certificate.deleteMany({
            course_ref: courseId,
            user_ref: user._id,
          });
          await course.save();
        }
        console.log(
          `✅ Updated course ${courseId} - removed expired subscriptions`
        );
      });
      console.log(
        `✅ Updated user ${user._id} - removed expired subscriptions`
      );
    }
    res.status(200).json({ message: "Expired subscriptions removed successfully" });
  } catch (err) {
    console.error(
      "❌ Error while removing expired subscriptions:",
      err.message
    );
    res.status(500).json({ message: "Error removing expired subscriptions", error: err.message });
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