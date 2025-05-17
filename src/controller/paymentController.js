const Payment = require("../model/paymentModel");
const crypto = require("crypto");
const express = require("express");
const Razorpay = require("razorpay");
const Course = require("../model/course_model");
const User = require("../model/user_model");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
exports.createOrder = async (req, res) => {
  const { userRef, courseRef, amountPaid, paymentType, callback_url } =
    req.body;

  try {
    // 1. Fetch user details
    const user = await User.findById(userRef);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Create Razorpay order
    const orderOptions = {
      amount: amountPaid * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(orderOptions);

    // 3. Generate payment link using order.id as reference
    const paymentLink = await razorpay.paymentLink.create({
      amount: amountPaid * 100,
      currency: "INR",
      accept_partial: false,
      reference_id: order.id, // Use order.id as reference
      description: `Payment for course ${courseRef}`,
      customer: {
        name: user.displayName || "Customer",
        email: user.email,
        contact: user.phone || "9999999999",
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      notes: {
        userRef,
        courseRef,
        paymentType,
        razorpay_order_id: order.id, // Explicitly include order ID
      },
      callback_url,
      callback_method: "get",
    });

    // 4. Save payment record with proper IDs
    const payment = new Payment({
      userRef,
      courseRef,
      amountPaid,
      transactionId: order.receipt,
      paymentType,
      razorpay_order_id: order.id, // Store the actual order ID
      razorpay_payment_link_id: paymentLink.id,
      razorpay_reference_id: paymentLink.reference_id, // For cross-reference
      payment_link: paymentLink.short_url,
      status: "created",
    });

    await payment.save();

    // 5. Return response
    res.json({
      success: true,
      orderId: order.id, // Return the actual order ID
      paymentLink: paymentLink.short_url,
      paymentLinkId: paymentLink.id,
      referenceId: paymentLink.reference_id,
    });
  } catch (err) {
    console.error("Payment Error:", err.error || err);
    res.status(500).json({
      success: false,
      error: "Payment processing failed",
      details: err.error?.description || err.message,
    });
  }
};

exports.handleWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const razorpaySig = req.headers["x-razorpay-signature"];

  // 1️⃣  Verify HMAC
  const digest = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.body) // because we used express.raw()
    .digest("hex");

  if (digest !== razorpaySig) {
    return res.status(400).send("❌  Invalid webhook signature");
  }

  // 2️⃣  Parse event
  const { event } = JSON.parse(req.body);

  try {
    switch (event) {
      /* ───────────────────────────────────────────────────────── payment_link.paid */
      case "payment_link.paid": {
        const link = JSON.parse(req.body).payload.payment_link.entity;
        const payId = link.payment_id; // Razorpay payment_id
        const linkId = link.id; // Razorpay payment_link_id

        // Fetch our Payment record that we created earlier
        const payment = await Payment.findOne({
          razorpay_payment_link_id: linkId,
        });
        if (!payment) break; // no matching record → ignore event

        payment.status = "success";
        payment.transactionId = payId;
        payment.razorpay_payment_id = payId;
        await payment.save();

        // Update user subscription
        await User.findByIdAndUpdate(
          payment.userRef,
          {
            subscription: {
              payment_id: payment._id,
              payment_Status: "success",
              course_enrolled: payment.courseRef,
              is_subscription_active: true,
              created_at: new Date(),
            },
          },
          { new: true }
        );

        break;
      }

      /* ──────────────────────────────────────────────────────── payment_link.failed */
      case "payment_link.failed": {
        const link = JSON.parse(req.body).payload.payment_link.entity;
        const linkId = link.id;

        const payment = await Payment.findOne({
          razorpay_payment_link_id: linkId,
        });
        if (!payment) break;

        payment.status = "failed";
        payment.failure_reason = link.failure_reason || "Unknown";
        await payment.save();

        await User.findByIdAndUpdate(payment.userRef, {
          subscription: {
            payment_id: payment._id,
            payment_Status: "failed",
            course_enrolled: null,
            is_subscription_active: false,
            created_at: new Date(),
          },
        });
        break;
      }

      /* ───────────────────────────────────────────────────────────── default/ignore */
      default:
        // Unhandled event – safely ignore
        console.log(`ℹ️  Received unhandled event ${event}`);
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).send("Internal webhook error");
  }
};
