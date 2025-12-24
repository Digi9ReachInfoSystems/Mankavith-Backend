const { dbConnect } = require("../config/database");

const {
  runCourseExpiryNotification
} = require("../controller/jobsController");

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await dbConnect();
  await runCourseExpiryNotification();

  res.status(200).json({ success: true });
};
