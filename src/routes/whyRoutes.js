const express = require("express");
const router = express.Router();
const WhyController = require("../controller/whyController");


router.post("/create", WhyController.createWhy);
router.get("/getAllWhys", WhyController.getAllWhy);
router.put("/updateWhy/:whyId", WhyController.updateWhyById);
router.delete("/deleteWhy/:whyId", WhyController.deleteWhyById);

module.exports = router;