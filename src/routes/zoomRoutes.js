const express = require("express");
const router = express.Router();

const zoomController = require("../controller/meetingController");

router.post("/create", zoomController.createZoomMeeting);

router.get("/getAllZoomMeetings", zoomController.getAllmeetings);
router.get("/getZoomMeetingById/:id", zoomController.getMeetingById);
router.get(
  "/getZoomMeetingByStudentId/:studentId",
  zoomController.getmeetingBystudent
);
module.exports = router;
