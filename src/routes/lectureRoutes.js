const express = require("express");
const router = express.Router();
const lectureController = require("../controller/lectureController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
// Create a new lecture
router.post("/",upload.single('videoUrl'), lectureController.createLecture);
router.get("/", lectureController.getAllLectures);
router.get("/:id", lectureController.getLectureById);
router.put("/:id", lectureController.updateLecture);
router.delete("/:id", lectureController.deleteLecture);
router.delete("/bulk/delete", lectureController.bulkDeleteLectures);
router.put("/lectures/rearrangeLectures", lectureController.rearrangeLectures);
module.exports = router;
