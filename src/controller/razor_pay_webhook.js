// controllers/webhookController.js
const crypto = require("crypto");
const User = require("../model/user_model");
const Payment = require("../model/paymentModel");
const Course = require("../model/course_model");
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    // Skip signature verification since no secret is configured
    console.warn("Warning: Webhook signature verification is disabled");

    // Process the event
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
    res.status(500).json({ success: false, error: error.message });
  }
};

// Handle payment_link.paid event
async function handlePaymentLinkPaid(paymentLink, payment) {
  try {
    // 1. Find the payment record
    const paymentRecord = await Payment.findOne({
      razorpay_payment_link_id: paymentLink.id,
    });

    if (!paymentRecord) {
      console.error(
        "Payment record not found for payment link:",
        paymentLink.id
      );
      return;
    }

    // 2. Update payment status
    paymentRecord.status = "captured";
    paymentRecord.razorpay_payment_id = payment.id;
    paymentRecord.paidAt = new Date();
    await paymentRecord.save();

    // 3. Update user subscription
    await User.findByIdAndUpdate(paymentRecord.userRef, {
      $set: {
        "subscription.payment_id": paymentRecord._id,
        "subscription.payment_Status": "success",
        "subscription.course_enrolled": paymentRecord.courseRef,
        "subscription.is_subscription_active": true,
        "subscription.created_at": new Date(),
      },
    });

    console.log(`Subscription updated for user: ${paymentRecord.userRef}`);
  } catch (error) {
    console.error("Error handling payment link paid:", error);
  }
}

// Handle payment.captured event (backup)
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
    await User.findByIdAndUpdate(paymentRecord.userRef, {
      $set: {
        "subscription.payment_id": paymentRecord._id,
        "subscription.payment_Status": "success",
        "subscription.course_enrolled": paymentRecord.courseRef,
        "subscription.is_subscription_active": true,
        "subscription.created_at": new Date(),
      },
    });

    console.log(`Subscription updated for user: ${paymentRecord.userRef}`);
  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}
