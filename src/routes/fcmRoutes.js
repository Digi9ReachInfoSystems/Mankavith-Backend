const express = require("express");
const router = express.Router();
const fcmController = require("../controller/fcmController");
// const authMiddleware = require("./middlewares/auth"); // your JWT middleware that sets req.user

router.post("/fcm/register", fcmController.registerToken);
router.post("/fcm/unregister", fcmController.unregisterToken);

module.exports = router;
