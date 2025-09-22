const express = require("express");
const router = express.Router();
const WhyController = require("../controller/whyController");


router.post("/create", WhyController.createWhy);
router.get("/getAllWhys", WhyController.getAllWhy);
router.put("/updateWhy/:whyId", WhyController.updateWhyById);
router.delete("/deleteWhy/:whyId", WhyController.deleteWhyById);
router.get("/getWhyById/:whyId", WhyController.getWhyById);
router.delete("/bulk/deleteWhys", WhyController.bulkDeleteWhys);
module.exports = router;