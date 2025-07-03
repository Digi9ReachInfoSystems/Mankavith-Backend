const express = require("express");
const router = express.Router();
const recordedSessionController = require("../controller/recordedSession");

// Basic CRUD operations
router.post("/", recordedSessionController.createRecordedSession);
router.get("/", recordedSessionController.getAllRecordedSessions);
router.get("/:id", recordedSessionController.getRecordedSessionById);
router.put("/:id", recordedSessionController.updateRecordedSession);
router.delete("/:id", recordedSessionController.deleteRecordedSession);

// Specialized routes
router.get("/course/:courseId", recordedSessionController.getSessionsByCourse);
router.delete("/bulk/delete", recordedSessionController.bulkDeleteRecordedSession);
module.exports = router;
