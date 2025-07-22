const express = require("express");
const router = express.Router();
const masterOtpController = require("../controller/masterOtpController");

router.get("/getMasterOTP", masterOtpController.getMasterOTP);
router.put("/updateMasterOTP", masterOtpController.updateMasterOTP);

module.exports = router;