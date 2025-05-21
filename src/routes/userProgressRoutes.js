const express = require("express");
const router = express.Router();
const userProgressController = require("../controller/userProgressController");


router.post("/startCourse", userProgressController.startCourse);
router.post("/startSubject", userProgressController.startSubject);
router.post("/startLecture", userProgressController.startLecturer);
router.post("/completeLecture", userProgressController.completeLecturer);
router.post("/completeSubject",userProgressController.completeSubject);
router.post("/completeCourse",userProgressController.completeCourse)


module.exports = router;