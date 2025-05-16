const crypto = require("crypto");
const User = require("../model/user_model");
const Payment = require("../model/paymentModel");
const Course = require("../model/course_model");
const mongoose = require("mongoose");

exports.handleRazorpayWebhook = async (req, res) => {
  try {
    // 1. Verify webhook signature
    const razorpaySignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    // Create signature from raw body
    const body = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      console.error("Invalid webhook signature");
      return res.status(403).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // 2. Process the event
    const event = req.body.event;
    const paymentEntity = req.body.payload.payment?.entity;
    const paymentLinkEntity = req.body.payload.payment_link?.entity;
    const orderEntity = req.body.payload.order?.entity;

    switch (event) {
      case "payment_link.paid":
        await handlePaymentLinkPaid(paymentLinkEntity, paymentEntity);
        break;

      case "payment.captured":
      case "order.paid": // Handle both payment.captured and order.paid
        await handlePaymentCaptured(paymentEntity || orderEntity.payment);
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
        // Consider logging the full payload for debugging:
        console.log("Full webhook payload:", JSON.stringify(req.body, null, 2));
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      note: "Please verify RAZORPAY_WEBHOOK_SECRET is correct",
    });
  }
};

// Handle payment_link.paid event
async function handlePaymentLinkPaid(paymentLink, payment) {
  try {
    // 1. Find the payment record
    const paymentRecord = await Payment.findOne({
      $or: [
        { razorpay_payment_link_id: paymentLink.id },
        { razorpay_reference_id: paymentLink.reference_id },
      ],
    });

    if (!paymentRecord) {
      console.error("Payment not found for payment link:", {
        payment_link_id: paymentLink.id,
        reference_id: paymentLink.reference_id,
      });
      return;
    }

    // 2. Update payment status
    paymentRecord.status = "captured";
    paymentRecord.razorpay_payment_id = payment.id;
    paymentRecord.paidAt = new Date();
    await paymentRecord.save();

    // 3. Update user subscription
    await updateUserSubscription(paymentRecord);

    console.log(
      `Payment ${payment.id} captured for user: ${paymentRecord.userRef}`
    );
  } catch (error) {
    console.error("Error handling payment link paid:", error);
    throw error; // Propagate to main handler
  }
}

// Handle payment.captured event
async function handlePaymentCaptured(payment) {
  try {
    // Find payment by multiple possible identifiers
    const paymentRecord = await Payment.findOne({
      $or: [
        { razorpay_order_id: payment.order_id },
        { razorpay_reference_id: payment.reference_id },
        { razorpay_payment_link_id: payment.payment_link?.id }, // For payment_link references
      ],
    });

    if (!paymentRecord) {
      console.error("Payment not found for:", {
        payment_id: payment.id,
        order_id: payment.order_id,
        reference_id: payment.reference_id,
      });
      return;
    }

    // Update payment status
    paymentRecord.status = "captured";
    paymentRecord.razorpay_payment_id = payment.id;
    paymentRecord.paidAt = new Date();
    await paymentRecord.save();

    // Update user subscription
    await updateUserSubscription(paymentRecord);

    console.log(
      `Payment ${payment.id} captured for user: ${paymentRecord.userRef}`
    );
  } catch (error) {
    console.error("Error handling payment:", {
      error: error.message,
      payment_id: payment?.id,
      stack: error.stack,
    });
    throw error;
  }
}

// Common subscription update logic
async function updateUserSubscription(paymentRecord) {
  try {
    const userId = paymentRecord.userRef;

    console.log(
      `[updateUserSubscription] Updating subscription for user ID: ${userId}`
    );

    // Ensure it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userRef in payment record");
    }

    const subscriptionUpdate = {
      payment_id: paymentRecord._id,
      payment_Status: "success",
      course_enrolled: paymentRecord.courseRef,
      is_subscription_active: true,
      created_at: new Date(),
    };

    const result = await User.findByIdAndUpdate(
      userId,
      { $set: { subscription: subscriptionUpdate } },
      { new: true }
    );

    if (!result) {
      console.error(`[updateUserSubscription] User not found: ${userId}`);
    } else {
      console.log(`[updateUserSubscription] Subscription updated successfully`);
    }

    return result;
  } catch (error) {
    console.error("[updateUserSubscription] Error:", error.message);
    throw error;
  }
}
