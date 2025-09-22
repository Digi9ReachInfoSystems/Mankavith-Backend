const express = require("express");
const router = express.Router();
const EntranceController = require("../controller/entranceController");

router.post("/create", EntranceController.createEntrance);
router.get("/getAllEntrances", EntranceController.getAllEntrances);
router.get("/getEntranceById/:id", EntranceController.getEntranceById);
router.put("/updateEntrance/:id", EntranceController.updateEntranceById);
router.delete("/deleteEntrance/:id", EntranceController.deleteEntranceById);
router.delete("/bulk/deleteEntrances", EntranceController.bulkDeleteEntrances);
module.exports = router;