const express = require("express");
const router = express.Router();
const supportController = require("../controller/supportController");

router.post("/", supportController.createSupport);
router.get("/", supportController.getAllSupports);
router.get("/:id", supportController.getSupportById);
router.put("/:id", supportController.approveSupportById);
router.delete("/:id", supportController.deleteSupportById);
router.delete("/bulk/delete", supportController.bulkDeleteSupports);
module.exports = router;