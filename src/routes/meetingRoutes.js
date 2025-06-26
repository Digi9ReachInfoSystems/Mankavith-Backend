const express = require("express");
const router = express.Router();
const meetingController = require("../controller/meetingController");

router.post("/generateSignature", meetingController.generateMeetingSugnature);
router.get("/getAccessToken", meetingController.getZoomSdkAccessToken);
router.get("/createMeeting", meetingController.generateZoomMeeting);
router.post("/getlivemeetings", meetingController.getUpcomingAndOngoingMeetings);
router.get("/upcomingmeetings/:userId", meetingController.getALLUpcomingMeetings);
router.get("/getAllMeetings", meetingController.getAllmeetings);
module.exports = router;