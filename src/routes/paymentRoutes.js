const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

router.post("/createpayment", paymentController.createOrder);

module.exports = router;
