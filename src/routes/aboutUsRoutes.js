const express = require("express");
const router = express.Router();

const AboutUsController = require("../controller/aboutUsController");

router.post("/create", AboutUsController.createAboutUs);
router.get("/getAllAboutUs", AboutUsController.getAllAboutUs);
router.put("/updateAboutUs/:id", AboutUsController.updateAboutUs);
router.delete("/deleteAboutUs/:id", AboutUsController.deleteAboutUs);

module.exports = router;