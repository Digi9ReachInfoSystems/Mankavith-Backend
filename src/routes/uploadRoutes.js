const express = require("express");
const router = express.Router();
const uploadController = require("../utils/azureBlobService");
const multer = require('multer');
const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
// const multer = require("multer");
 
const upload = multer({
//   storage: multer.diskStorage({
//     // destination: (req, file, cb) => cb(null, "uploads/"),
//     filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
//   }),
    storage: storage,
  limits: { fileSize: 2024 * 1024 * 1024 } // 1 GB limit
});

router.post("/uploadData", upload.single('file'), uploadController.uploadNotestest);
module.exports = router;