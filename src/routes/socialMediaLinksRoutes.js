const express = require("express");
const router = express.Router();
const socialMediaLinksController = require("../controller/socialMediaLinksController");

router.get("/getAllSocialMediaLinks", socialMediaLinksController.getSocialMediaLinks);
router.post("/createSocialMediaLinks", socialMediaLinksController.createSocialMediaLinks);
router.put("/updateSocialMediaLinks", socialMediaLinksController.updataSocialMediaLinks);
router.post("/addYoutubeVideoLink", socialMediaLinksController.addYoutubeVideo);
router.delete("/removeYoutubeVideoLink/:videoId", socialMediaLinksController.removeVideo);
router.put("/updateYoutubeVideoLink/:videoId", socialMediaLinksController.updateVideo);
router.put("/setHomepageYoutubeVideoLink/:videoId", socialMediaLinksController.setHomepageVideo);
router.get("/getHomepageYoutubeVideoLink", socialMediaLinksController.getHomepageVideo);
router.get("/getAllYoutubeVideoLinks", socialMediaLinksController.getAllYoutubeVideos);
router.get("/getOtherYoutubeVideoLinks", socialMediaLinksController.getNonHomepageVideos);

module.exports = router;