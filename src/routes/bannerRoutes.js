const express = require("express");
const router = express.Router();
const bannerController = require("../controller/bannerController");

// Create a new banner
router.post("/", bannerController.createBanner);

// Get all banners
router.get("/", bannerController.getAllBanners);

// Get banner by ID
router.get("/:id", bannerController.getBannerById);

// Update banner
router.put("/:id", bannerController.updateBanner);

// Delete banner
router.delete("/:id", bannerController.deleteBanner);

// Get banners by course ID
router.get("/course/:courseId", bannerController.getBannersByCourse);

module.exports = router;
