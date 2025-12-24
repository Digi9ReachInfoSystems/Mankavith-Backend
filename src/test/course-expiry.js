const dbConnect = require("../config/database");
const { runCourseExpiryNotification } = require("../controller/jobsController");

module.exports = async function courseExpiryTest(req, res) {
  await dbConnect();
  await runCourseExpiryNotification();
  res.status(200).json({
    success: true,
    message: "Test executed"
  });
};