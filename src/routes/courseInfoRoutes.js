const express = require("express");
const router = express.Router();
courseInfoController = require("../controller/courseInfoController");

router.post("/create", courseInfoController.create);
router.get("/get", courseInfoController.get);
router.put("/update", courseInfoController.update);

module.exports = router;