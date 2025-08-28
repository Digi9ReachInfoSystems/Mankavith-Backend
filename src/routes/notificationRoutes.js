const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");

router.post("/create", notificationController.sendNotification);
router.get("/getUserNotifications/:userId", notificationController.getUserNotifications);
router.get("/getNotificationById/:notificationId", notificationController.getNotificationById);
// router.put("/updateNotification/:id", notificationController.updateNotification);
router.put("/markAsRead/:userId", notificationController.markNotificationsAsRead);
router.delete(
  "/userNotifications/:userNotificationId",
  notificationController.clearUserNotification
);

router.get("getAllNotifications", notificationController.getAllNotifications);
module.exports = router;