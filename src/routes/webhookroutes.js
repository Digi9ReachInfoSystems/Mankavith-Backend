// routes/webhookRoutes.js
const express = require("express");

router.post(
  "/razorpay-webhook",
  express.raw({ type: "application/json" }),
  webhookController.handleRazorpayWebhook
);

module.exports = router;
