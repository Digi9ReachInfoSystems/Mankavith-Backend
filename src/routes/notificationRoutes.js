const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");

router.post("/create", notificationController.sendNotification);
router.get("/getUserNotifications/:userId", notificationController.getUserNotifications);
router.get("/getNotificationById/:notificationId", notificationController.getNotificationById);
// router.put("/updateNotification/:id", notificationController.updateNotification);
// router.delete("/deleteNotification/:id", notificationController.deleteNotification);
module.exports = router;