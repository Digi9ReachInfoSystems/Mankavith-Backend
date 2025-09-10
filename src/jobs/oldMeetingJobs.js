const cron = require("node-cron");
const Meeting = require("../model/meetingsModel"); // adjust path

// Run every day at midnight
exports.removeOldMeetings = cron.schedule("0 0 * * *", async () => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await Meeting.deleteMany({
      meeting_time: { $lt: oneMonthAgo }
    });

    console.log(`🗑️ Deleted ${result.deletedCount} meetings older than 1 month`);
  } catch (err) {
    console.error("Error cleaning old meetings:", err);
  }
});
