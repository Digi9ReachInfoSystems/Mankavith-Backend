const express = require("express");
const router = express.Router();
const feedbackController = require("../controller/feedbackController");

router.post("/", feedbackController.createFeedback);
router.get("/", feedbackController.getFeedback);
router.get("/:id", feedbackController.getFeedBackById);
router.put("/:id", feedbackController.updateFeedback);
router.delete("/:id", feedbackController.deleteFeedback);
router.patch("/:id/approve", feedbackController.approveFeedback);
router.delete("/bulk/delete", feedbackController.bulkDeleteFeedback);

module.exports = router;
