const express = require("express");
const router = express.Router();
const meetingController = require("../controller/meetingController");

router.post("/generateSignature", meetingController.generateZoomSignature);

module.exports = router;