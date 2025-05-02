const express = require("express");
const router = express.Router();
const certificateController = require("../controller/certficateController");

// Basic CRUD operations
router.post("/", certificateController.createCertificate);
router.get("/", certificateController.getAllCertificates);
router.get("/:id", certificateController.getCertificateById);
router.put("/:id", certificateController.updateCertificate);
router.delete("/:id", certificateController.deleteCertificate);

// Specialized routes
router.get("/user/:userId", certificateController.getCertificatesByUser);
router.get("/course/:courseId", certificateController.getCertificatesByCourse);

module.exports = router;
