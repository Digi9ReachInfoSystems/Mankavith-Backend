const express = require("express");
const router = express.Router();

const QuestionController = require("../controller/questionController");

router.post("/create",  QuestionController.addPaper);
router.get("/getAllQuestionpapers", QuestionController.getAllQuestionpapers);
router.get("/getByTitle/:title", QuestionController.getQuestionPaperByTitle);
router.get("/getByTitleAndYear/:title/:year", QuestionController.getQuestionPaperByTitleAndYear);
router.put("/addQuestionPaper/:title", QuestionController.addQuestionPaper);
router.put("/removeQuestionPaper/:title/:year", QuestionController.removeQuestionPaper);
router.put("/updateQuestionPaper/:title/:year", QuestionController.updateQuestionPaper);
router.delete("/deleteQuestionPaper/:title/papers/:year", QuestionController.deletePaper);
router.delete("/bulk/deleteQuestionPapers", QuestionController.bulkDeletePapers);
module.exports = router;