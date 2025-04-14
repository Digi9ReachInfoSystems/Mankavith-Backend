const express = require("express");
const router = express.Router();
const previousController = require("../controller/examController");

router.post("/create", previousController.createExam);
router.get("/getAllPrevious", previousController.getAllExam);
router.get("/getPreviousById/:id", previousController.getExamById);
router.put("/updatePrevious/:id", previousController.updateExam);
router.delete("/deletePrevious/:id", previousController.deleteExam);

module.exports = router;