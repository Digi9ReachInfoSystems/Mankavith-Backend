const express = require("express");
const router = express.Router();
const StaticController = require("../controller/staticController");

router.post("/create", StaticController.createStatic);
router.put("/updateStatic/:staticId", StaticController.updateStatic);
router.get("/getAllStatics", StaticController.getAllStatic);
module.exports = router;