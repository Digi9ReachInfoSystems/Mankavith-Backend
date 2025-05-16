// routes/webhookRoutes.js
const express = require("express");
const router = express.Router();
const webhookController = require("../controller/razor_pay_webhook");

router.post(
  "/razorpay-webhook",
  express.raw({ type: "application/json" }),
  webhookController.handleRazorpayWebhook
);

module.exports = router;
