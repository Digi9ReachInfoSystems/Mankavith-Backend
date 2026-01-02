const cron = require("node-cron");
const User = require("../model/user_model");
const Course = require("../model/course_model");
const moment = require("moment-timezone");
const UserNotification = require("../model/userNotificationModel");
const admin = require("../utils/firebaseAdmin");


exports.sendSubscriptionExpiryAlerts = cron.schedule("* * * * *", async () => {
    console.log("⏰ Running cron: subscription expiry alerts");

    const now = moment().tz("Asia/Kolkata");
    const from = now.clone().add(2, "days").startOf("hour").toDate();
    const to = now.clone().add(2, "days").endOf("hour").toDate();
    console.log(`Checking for subscriptions expiring between ${from} and ${to}`);
    try {
        const users = await User.find({
            "subscription.expires_at": { $gte: from, $lte: to },
            "subscription.expiry_notification_sent": false,
            isBlocked: false,
            fcmToken: { $exists: true, $ne: null }
        }).populate("subscription.course_enrolled");

        if (!users.length) return;

        for (const user of users) {
            const tokens = user.fcmToken ? [user.fcmToken] : [];
            if (!tokens.length) continue;

            for (const sub of user.subscription) {
                if (
                    sub.expires_at >= from &&
                    sub.expires_at <= to &&
                    !sub.expiry_notification_sent
                ) {
                    const courseName = sub.course_enrolled?.courseDisplayName || "your course";

                    const title = " Course Expiry Reminder";
                    const body = `Your course "${courseName}" will expire in 2 days.`;

                    await UserNotification.create({
                        user_ref: user._id,
                        title,
                        description: body,
                        read: false,
                        time: new Date()
                    });
                    try {
                        const response = await admin.messaging().sendEachForMulticast({
                            tokens,
                            notification: { title, body },
                            data: {
                                type: "COURSE_EXPIRY",
                                courseId: sub.course_enrolled?._id?.toString() || ""
                            }
                        });
                        // console.log(`Sent FCM to user ${user._id}:`, response);
                    } catch (err) { 
                        console.error(`Error sending FCM to user ${user._id}:`, err);
                    }


                    sub.expiry_notification_sent = true;
                }
            }

            await user.save();
            console.log(`✅ Expiry alert sent to user ${user._id}`);
        }
    } catch (err) {
        console.error("❌ Expiry notification cron error:", err);
    }
});
