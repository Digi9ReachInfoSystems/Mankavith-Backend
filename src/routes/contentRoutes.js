const express = require("express");
const router = express.Router();
const ContentController = require("../controller/contentController");

router.post("/create", ContentController.createContent);
router.get("/getAllContents", ContentController.getAllContents);
router.get("/getContentById/:contentId", ContentController.getContentById);
router.put("/updateContent/:contentId", ContentController.updateContent);
router.delete("/deleteContentById/:contentId", ContentController.deleteContentById);

module.exports = router;