const express = require("express");
const router = express.Router();
const aspirantController = require("../controller/aspirantController");

router.post("/create", aspirantController.createAspirant);
router.get("/getAllAspirants", aspirantController.getAllAspirants);
router.get("/getAspirantById/:id", aspirantController.getAspirantById);
router.put("/updateAspirant/:id", aspirantController.updateAspirantById);
router.delete("/deleteAspirant/:id", aspirantController.deleteAspirantById);
module.exports = router;