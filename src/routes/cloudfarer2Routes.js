const path = require("path");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const express = require('express');
const cloudfarer2Controller = require("../controller/cloudfarer2Controller");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const router = express.Router();

router.post("/create-file", cloudfarer2Controller.createFolder);
router.delete("/delete-file", cloudfarer2Controller.deleteFolder);
router.put("/update-file", cloudfarer2Controller.updateFileInFolder);
router.post("/read-file", cloudfarer2Controller.readFile);
router.get("/list-files", cloudfarer2Controller.listFiles);
router.get("/list-folders", cloudfarer2Controller.listFolders);
router.post("/duplicate-folder", cloudfarer2Controller.duplicateFolders);
router.put("/rename-folder", cloudfarer2Controller.renameFolder);
router.post("/upload-files", upload.single('file'), cloudfarer2Controller.uploadFiles);

// router.get("/files", cloudfarer2Controller.accessFile);




module.exports = router;
