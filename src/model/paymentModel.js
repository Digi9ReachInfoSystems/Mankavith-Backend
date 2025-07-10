const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  courseRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    // enum: ["pending", "success", "failed", "refunded"],
    // default: "pending",
  },
  paymentType: {
    type: String,
    required: true,
    enum: ["WEB", "MOBILE"],
  },
  razorpay_order_id: {
    type: String,
  },
  razorpay_payment_id: {
    type: String,
  },
  razorpay_signature: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  couponApplied:{
    type:Boolean,
    default:false
  },
  couponRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
  },
  couponDiscount: {
    type: Number,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
