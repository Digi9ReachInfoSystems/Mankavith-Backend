const cron = require("node-cron");
const User = require("../model/user_model");
const UserProgress = require("../model/userProgressModel");
const Course = require("../model/course_model");
const moment = require("moment-timezone");
// Run job every night at 12:00 AM
exports.removeExpiredSubscriptions = cron.schedule("0 0 * * *", async () => {

// exports.removeExpiredSubscriptions = cron.schedule(
//   "*/10 * * * * *",
//   async () => {
    console.log("🔄 Running cron job: remove expired subscriptions");

    const now = new Date();

    try {
      const users = await User.find({
        "subscription.expires_at": { $lte: now },
      });
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
        expiredCourseIds = expiredCourseIds.filter((id) => id !== null);

        user.subscription = user.subscription.filter(
          (sub) => sub.expires_at > now
        );

        await user.save();
        if (user.subscription.length > 0) {
          const userProgress = await UserProgress.findOne({
            user_id: user._id,
          });
          if (userProgress) {
            userProgress.courseProgress = userProgress.courseProgress.filter(
              (progress) => !expiredCourseIds.includes(progress.course_id)
            );
            await userProgress.save();
          }
        }
        expiredCourseIds.forEach(async (courseId) => {
          const course = await Course.findById(courseId);
          if (course) {
            course.student_enrolled = course.student_enrolled.filter(
              (studentId) => !studentId.equals(user._id)
            );
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
    } catch (err) {
      console.error(
        "❌ Error while removing expired subscriptions:",
        err.message
      );
    }
  }
);
