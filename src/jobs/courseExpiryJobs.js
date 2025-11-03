const cron = require("node-cron");
const User = require("../model/user_model");
const UserProgress = require("../model/userProgressModel");
const Course = require("../model/course_model");
const MockTest = require("../model/mockTestModel");
const UserAttempt = require("../model/userAttemptModel");
const UserRankings = require("../model/userRankingModel");
const Subject = require("../model/subject_model");
const moment = require("moment-timezone");
// Run job every night at 12:00 AM
exports.removeExpiredSubscriptions =
  //  cron.schedule("0 0 * * *", async () => {
  cron.schedule("* * * * *", async () => {
    // exports.removeExpiredSubscriptions = cron.schedule(
    //   "*/10 * * * * *",
    //   async () => {
    console.log("🔄 Running cron job: remove expired subscriptions");

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
