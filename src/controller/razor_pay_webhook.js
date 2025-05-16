const crypto = require("crypto");
const User = require("../model/user_model");
const Payment = require("../model/paymentModel");
const Course = require("../model/course_model");

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

    switch (event) {
      case "payment_link.paid":
        await handlePaymentLinkPaid(paymentLinkEntity, paymentEntity);
        break;

      case "payment.captured":
        await handlePaymentCaptured(paymentEntity);
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
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
    // 1. Find the payment record
    const paymentRecord = await Payment.findOne({
      $or: [
        { razorpay_order_id: payment.order_id },
        { razorpay_reference_id: payment.reference_id },
      ],
    });

    if (!paymentRecord) {
      console.error("Payment not found for:", {
        order_id: payment.order_id,
        reference_id: payment.reference_id,
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
    console.error("Error handling payment captured:", error);
    throw error; // Propagate to main handler
  }
}

// Common subscription update logic
async function updateUserSubscription(paymentRecord) {
  await User.findByIdAndUpdate(paymentRecord.userRef, {
    $set: {
      "subscription.payment_id": paymentRecord._id,
      "subscription.payment_Status": "success",
      "subscription.course_enrolled": paymentRecord.courseRef,
      "subscription.is_subscription_active": true,
      "subscription.created_at": new Date(),
    },
  });
}
