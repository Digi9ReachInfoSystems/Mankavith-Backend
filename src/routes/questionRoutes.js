const express = require("express");
const router = express.Router();

const QuestionController = require("../controller/questionController");

router.post("/create",  QuestionController.addPaper);
router.get("/getAllQuestionpapers", QuestionController.getAllQuestionpapers);
router.get("/getQuestionPaperById/:id", QuestionController.getQuestionPaperById);
router.put("/updateQuestionPaper/:id", QuestionController.updateQuestionPaper);
router.delete("/deleteQuestionPaper/:id", QuestionController.deleteQuestionPaper);

module.exports = router;