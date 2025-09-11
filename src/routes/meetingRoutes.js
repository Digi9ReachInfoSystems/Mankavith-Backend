const express = require("express");
const router = express.Router();
const meetingController = require("../controller/meetingController");

router.post("/generateSignature", meetingController.generateMeetingSugnature);
router.get("/getAccessToken", meetingController.getZoomSdkAccessToken);
// router.get("/createMeeting", meetingController.generateZoomMeeting);
router.post("/getlivemeetings", meetingController.getUpcomingAndOngoingMeetings);
router.get("/upcomingmeetings/:userId", meetingController.getALLUpcomingMeetings);
router.get("/getAllMeetings", meetingController.getAllmeetings);
router.post("/create/Meeting", meetingController.createZoomMeetingMeOrOtherHost);
router.delete("/delete/Meeting/:id", meetingController.deleteMeetingById);
router.patch("/update/Meeting/:id", meetingController.updateMeetingById);
router.get("/getMeetingById/:id", meetingController.getMeetingById);
router.post("/getMeetngs/byHost", meetingController.getmeetingByHostEmail);
router.delete("/bulk/delete/meetings", meetingController.bulkDeleteMeetings);
router.get("/getupcoming/meeting/mobile/:courseId",meetingController.getOngoingMeetingsByCourse);
router.patch("/update/isEnded/:meetingId", meetingController.toggleIsEndedMeeting);
module.exports = router;