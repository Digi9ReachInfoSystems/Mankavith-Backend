const User = require("../model/user_model");
const UserProgress = require("../model/userProgressModel");
const Course = require("../model/course_model");

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
