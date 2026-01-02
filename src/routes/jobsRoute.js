const express = require("express");
const router = express.Router();
const jobsController = require("../controller/jobsController");


router.get("/subscriptionExpiry", jobsController.removeExpiredSubscriptions);
router.get("/oldMeetings", jobsController.cleanOldMeetings);
router.get("/scheduledNotifications", jobsController.sendScheduledNotifications);
router.get("/deleteOldNotifications", jobsController.removeOldNotifications);   
router.get("/courseExpiryAlerts", jobsController.courseExpiryReminderJob);
module.exports = router;