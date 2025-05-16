// routes/webhookRoutes.js
const express = require("express");
const router = express.Router();
const webhookController = require("../controller/razor_pay_webhook");
const rawBodyMiddleware = require("../middleware/bodyParser");
router.post(
  "/razorpay-webhook",
  rawBodyMiddleware,
  webhookController.handleRazorpayWebhook
);
module.exports = router;
