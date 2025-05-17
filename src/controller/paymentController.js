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
  const tsISO = new Date().toISOString();
  const sigHeader = req.headers["x-razorpay-signature"];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  /* ── 0️⃣  RAW LOGGING (helps confirm you’re really getting the data you expect) */
  console.log(`\n📨  Razorpay webhook @ ${tsISO}`);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body (raw):", req.body.toString());

  /* ── 1️⃣  VERIFY SIGNATURE  ────────────────────────────────────────────────── */
  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.body) // req.body is a Buffer because you used express.raw()
    .digest("hex");

  console.log("Expected-HMAC:", expectedSig);
  console.log("Received-HMAC:", sigHeader);

  if (expectedSig !== sigHeader) {
    console.error("❌  Signature mismatch – ignoring webhook");
    return res.status(400).send("Invalid signature");
  }

  /* ── 2️⃣  PARSE PAYLOAD  ───────────────────────────────────────────────────── */
  let payload;
  try {
    payload = JSON.parse(req.body);
  } catch (err) {
    console.error("❌  Couldn’t parse JSON body:", err);
    return res.status(400).send("Malformed JSON");
  }

  const { event } = payload;
  console.log(`⚡  Event → ${event}`);

  /* ── 3️⃣  HELPER FUNCTIONS  ───────────────────────────────────────────────── */
  const recordSuccess = async ({ linkId, payId }) => {
    console.log(`➡️  SUCCESS  linkId=${linkId}  payId=${payId}`);

    // 1. Mark Payment document
    const payment = await Payment.findOne({ razorpay_payment_link_id: linkId });
    if (!payment) {
      console.warn("⚠️  No Payment doc found for linkId", linkId);
      return;
    }

    payment.status = "success";
    payment.transactionId = payId;
    payment.razorpay_payment_id = payId;
    await payment.save();
    console.log("✅  Payment doc updated:", payment._id);

    // 2. Patch User subscription
    await User.findByIdAndUpdate(payment.userRef, {
      subscription: {
        payment_id: payment._id,
        payment_Status: "success",
        course_enrolled: payment.courseRef,
        is_subscription_active: true,
        created_at: new Date(),
      },
    });
    console.log("✅  User subscription activated for user", payment.userRef);
  };

  const recordFailure = async ({ linkId, reason }) => {
    console.log(`➡️  FAILURE  linkId=${linkId}  reason=${reason}`);

    const payment = await Payment.findOne({ razorpay_payment_link_id: linkId });
    if (!payment) {
      console.warn("⚠️  No Payment doc found for linkId", linkId);
      return;
    }

    payment.status = "failed";
    payment.failure_reason = reason;
    await payment.save();
    console.log("✅  Payment marked failed:", payment._id);

    await User.findByIdAndUpdate(payment.userRef, {
      subscription: {
        payment_id: payment._id,
        payment_Status: "failed",
        course_enrolled: null,
        is_subscription_active: false,
        created_at: new Date(),
      },
    });
    console.log("✅  User subscription de-activated for user", payment.userRef);
  };

  /* ── 4️⃣  ROUTING  ─────────────────────────────────────────────────────────── */
  try {
    switch (event) {
      /* ——————————————————————————————————————————— success-type events ———————— */
      case "payment_link.paid": {
        const link = payload.payload.payment_link.entity;
        await recordSuccess({ linkId: link.id, payId: link.payment_id });
        break;
      }

      case "payment.authorized": /* customer paid, auth completed  */
      case "order.paid": /* full order paid                */
      case "payment.captured": {
        /* funds captured (auto-capture)  */
        const pay = payload.payload.payment.entity;
        await recordSuccess({
          linkId: pay.notes?.razorpay_payment_link_id || pay.order_id,
          payId: pay.id,
        });
        break;
      }

      /* ——————————————————————————————————————————— failure-type events ———————— */
      case "payment_link.failed": {
        const link = payload.payload.payment_link.entity;
        await recordFailure({
          linkId: link.id,
          reason: link.failure_reason || "unknown",
        });
        break;
      }

      /* ——————————————————————————————————————————— everything else ————————— */
      default:
        console.log("ℹ️  Unhandled event – nothing to do");
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("❌  Webhook processing error:", err);
    res.status(500).send("Internal webhook error");
  }
};
