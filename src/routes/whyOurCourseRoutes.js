const express = require("express");
const router = express.Router();
const whyOurCourseController = require("../controller/whyOurCourseController");

router.post("/create", whyOurCourseController.createWhyOurCourse);
router.get("/getAllWhyOurCourse", whyOurCourseController.getAllWhyOurCourse);
router.get("/getWhyOurCourseById/:id", whyOurCourseController.getWhyOurCourseById);
router.put("/updateWhyOurCourse/:id", whyOurCourseController.updateWhyOurCourse);
router.delete("/deleteWhyOurCourse/:id", whyOurCourseController.deleteWhyOurCourse);

module.exports = router;