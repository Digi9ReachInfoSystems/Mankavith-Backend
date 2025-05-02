const express = require("express");
const router = express.Router();
const kycController = require("../controller/kycDetailsController");

// Basic CRUD operations
router.post("/", kycController.createKyc);
router.get("/", kycController.getAllKyc);
router.get("/:id", kycController.getKycById);
router.patch("/:id/status", kycController.updateKycStatus);
router.delete("/:id", kycController.deleteKyc);

router.get("/user/:userId", kycController.getKycByUser);

module.exports = router;
