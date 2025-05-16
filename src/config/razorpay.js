// config/razorpay.js
const Razorpay = require("razorpay");
const crypto = require("crypto");

module.exports = {
  razorpay: new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  }),
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,

  generateMobileSignature: (orderId, paymentId) => {
    const body = `${orderId}|${paymentId}`;
    return crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");
  },
};
