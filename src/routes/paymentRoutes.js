const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

router.post("/createpayment", paymentController.createOrder);
router.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);
router.get("/status/:id", paymentController.checkPaymentStatus);
router.get("/getAllPayments", paymentController.getAllPayments);
router.get("/getPaymentById/:id", paymentController.getPaymentById);
module.exports = router;
