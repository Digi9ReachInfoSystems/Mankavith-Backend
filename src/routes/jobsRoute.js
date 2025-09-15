const express = require("express");
const router = express.Router();
const jobsController = require("../controller/jobsController");


router.get("/subscriptionExpiry", jobsController.removeExpiredSubscriptions);
router.get("/oldMeetings", jobsController.cleanOldMeetings);

module.exports = router;