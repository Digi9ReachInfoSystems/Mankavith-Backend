const crypto = require("crypto");
const User = require("../model/user_model");
const Payment = require("../model/paymentModel");
const Course = require("../model/course_model");
const mongoose = require("mongoose");
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    // 1. Get raw body before any parsing
    const rawBody =
      req.rawBody ||
      (() => {
        let data = "";
        req.on("data", (chunk) => {
          data += chunk;
        });
        req.on("end", () => data);
        return data;
      })();

    // 2. Verify webhook signature
    const razorpaySignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({ success: false, message: "Server error" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      console.error("Invalid webhook signature", {
        received: razorpaySignature,
        expected: expectedSignature,
        body: rawBody.toString(),
      });
      return res
        .status(403)
        .json({ success: false, message: "Invalid signature" });
    }

    // 3. Parse JSON only after verification
    const webhookBody = JSON.parse(rawBody);
    const event = webhookBody.event;
    const paymentEntity = webhookBody.payload?.payment?.entity;

    // 4. Handle payment.authorized event
    if (event === "payment.authorized") {
      await handlePaymentAuthorized(paymentEntity);
    }
    // Add other event handlers as needed
    else {
      console.log(`Unhandled event type: ${event}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      note: "Check server logs for details",
    });
  }
};
async function handlePaymentAuthorized(payment) {
  try {
    // 1. Extract userRef from payment notes
    const userRef = payment.notes?.userRef;
    if (!userRef) {
      throw new Error("userRef not found in payment notes");
    }

    // 2. Validate userRef format
    if (!mongoose.Types.ObjectId.isValid(userRef)) {
      throw new Error(`Invalid userRef format: ${userRef}`);
    }

    // 3. Find payment record
    const paymentRecord = await Payment.findOne({
      $or: [
        { razorpay_order_id: payment.order_id },
        { razorpay_payment_id: payment.id },
      ],
    });

    if (!paymentRecord) {
      console.error("Payment record not found for:", {
        order_id: payment.order_id,
        payment_id: payment.id,
      });
      return;
    }

    // 4. Verify userRef matches payment record
    if (paymentRecord.userRef.toString() !== userRef) {
      throw new Error(
        `userRef mismatch: ${paymentRecord.userRef} vs ${userRef}`
      );
    }

    // 5. Update payment status
    paymentRecord.status = "authorized";
    paymentRecord.razorpay_payment_id = payment.id;
    paymentRecord.paymentMethod = payment.method;
    await paymentRecord.save();

    // 6. Update user subscription (if needed)
    await updateUserSubscription(paymentRecord);

    console.log(`Payment ${payment.id} authorized for user: ${userRef}`);
  } catch (error) {
    console.error("Error handling payment.authorized:", {
      error: error.message,
      payment_id: payment?.id,
      stack: error.stack,
    });
    throw error;
  }
}
// Handle payment_link.paid event
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
