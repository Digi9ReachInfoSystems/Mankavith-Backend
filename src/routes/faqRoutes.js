const express = require("express");

const FaqController = require("../controller/faqController");
const router = express.Router();

router.get("/getAllFaqs", FaqController.getAllFaqs);
router.get("/getFaqById/:id", FaqController.getFaqById);
router.post("/create", FaqController.createFaq);
router.put("/updateFaqById/:faqId", FaqController.updateFaqById);
router.delete("/deletFaqById/:faqId", FaqController.deleteFaqById);

module.exports = router;