const express = require("express");
const router = express.Router();
const uploadController = require("../utils/azureBlobService");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/uploadData", upload.single('file'), uploadController.uploadNotestest);
module.exports = router;