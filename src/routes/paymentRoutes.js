const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

router.post("/createpayment", paymentController.createOrder);
router.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

module.exports = router;
