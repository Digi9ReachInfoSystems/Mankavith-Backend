const express = require("express");
const router = express.Router();
const lectureController = require("../controller/lectureController");

// Create a new lecture
router.post("/", lectureController.createLecture);

// Get all lectures
router.get("/", lectureController.getAllLectures);

// Get a single lecture by ID
router.get("/:id", lectureController.getLectureById);

// Update a lecture by ID
router.put("/:id", lectureController.updateLecture);

// Delete a lecture by ID
router.delete("/:id", lectureController.deleteLecture);

router.delete("/bulk/delete", lectureController.bulkDeleteLectures);

module.exports = router;
