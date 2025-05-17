// controller/razorpayWebhook.js
// -------------------------------------------------------------------
// Validates Razorpay webhooks (payment.authorized, payment.captured,
// payment_link.paid) and updates the Payment collection plus the
// user's subscription.  Mount this handler with:
//   app.post("/razorpay-webhook", express.raw({type:"application/json"}), handleRazorpayWebhook)
// -------------------------------------------------------------------

const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const User = require("../model/user_model");
const Payment = require("../model/paymentModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// -------------------------------------------------------------------
// MAIN ENTRY
// -------------------------------------------------------------------
exports.handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const payloadBuf = req.body; // Buffer, provided by express.raw()

  // 1️⃣ Signature verification – abort early if it fails
  let verified = false;
  try {
    verified = Razorpay.validateWebhookSignature(payloadBuf, signature, secret);
  } catch (err) {
    console.error("[Webhook] Signature validation error:", err.message);
  }
  if (!verified)
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });

  // 2️⃣ Parse JSON *after* verification passes
  let eventData;
  try {
    eventData = JSON.parse(payloadBuf.toString());
  } catch (err) {
    console.error("[Webhook] Malformed JSON payload:", err);
    return res
      .status(400)
      .json({ success: false, message: "Malformed payload" });
  }

  // 3️⃣ Handle events
  try {
    const payment = eventData.payload?.payment?.entity;
    switch (eventData.event) {
      case "payment.authorized":
        await handlePaymentAuthorized(payment);
        break;
      case "payment.captured":
      case "payment_link.paid": // Payment Link flow ends here
        await handlePaymentCaptured(payment);
        break;
      default:
        console.log(`[Webhook] Unhandled event: ${eventData.event}`);
    }
    // Acknowledge quickly – Razorpay expects 2xx within ~5 s
    return res.sendStatus(200);
  } catch (err) {
    console.error("[Webhook] Processing error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Processing error" });
  }
};

// -------------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------------
async function handlePaymentAuthorized(payment) {
  // 🔄 Instead of reading payment.notes, look up the Payment record first
  const paymentRecord = await Payment.findOne({
    $or: [
      { razorpay_order_id: payment.order_id },
      { razorpay_payment_id: payment.id },
    ],
  });

  if (!paymentRecord) {
    console.warn("[payment.authorized] Payment record not found", payment.id);
    return;
  }

  // Now you already have the correct userRef inside paymentRecord
  paymentRecord.status = "authorized";
  paymentRecord.razorpay_payment_id = payment.id;
  paymentRecord.paymentMethod = payment.method;
  await paymentRecord.save();

  await updateUserSubscription(paymentRecord);
}

async function handlePaymentCaptured(payment) {
  const paymentRecord = await Payment.findOne({
    $or: [
      { razorpay_order_id: payment.order_id },
      { razorpay_reference_id: payment.reference_id },
      { razorpay_payment_link_id: payment.payment_link?.id },
    ],
  });
  if (!paymentRecord) {
    console.warn("[payment.captured] Payment record not found", payment.id);
    return;
  }

  paymentRecord.status = "captured";
  paymentRecord.razorpay_payment_id = payment.id;
  paymentRecord.paidAt = new Date();
  await paymentRecord.save();

  await updateUserSubscription(paymentRecord);
}

async function updateUserSubscription(paymentRecord) {
  const userId = paymentRecord.userRef;
  console.log(userId);
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new Error("Invalid userRef");

  const subscription = {
    payment_id: paymentRecord._id,
    payment_Status: "success",
    course_enrolled: paymentRecord.courseRef,
    is_subscription_active: true,
    created_at: new Date(),
  };

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { subscription } },
    { new: true }
  );

  if (!user) console.error("[updateUserSubscription] User not found", userId);
}
