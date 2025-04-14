const express = require("express");
const router = express.Router();

const AchieverController = require("../controller/achieverController");
const authenticateJWT = require("../middleware/authenticator");

router.post("/create",authenticateJWT, AchieverController.createAchievers);
router.get("/getAllAchievers", AchieverController.getAllAchievers);
router.get("/getAchieverById/:id", AchieverController.getAchieversById);
router.put("/updateAchiever/:id", AchieverController.updateAchiever);
router.delete("/deleteAchiever/:id", AchieverController.deleteAchiever);

module.exports = router;