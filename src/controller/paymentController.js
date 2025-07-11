/* ──────────────────────────────────────────────────────────────────────────────
 * controllers/paymentController.js
 * ---------------------------------------------------------------------------
 *  • createOrder   — builds a Razorpay order + payment-link, stores “pending”
 *                    Payment doc, returns link to the client.
 *  • handleWebhook — verifies Razorpay HMAC, handles success / failure events,
 *                    updates Payment + User.subscription in MongoDB.
 * ---------------------------------------------------------------------------
 *  NOTE
 *  ----
 *  In your route file make sure the webhook endpoint uses `express.raw`
 *  BEFORE any JSON/body-parser middleware or the HMAC check will fail:
 *
 *      router.post(
 *        "/webhook/razorpay",
 *        express.raw({ type: "application/json" }),
 *        paymentController.handleWebhook
 *      );
 * --------------------------------------------------------------------------- */

const crypto = require("crypto");
const Razorpay = require("razorpay");
const Payment = require("../model/paymentModel");
const User = require("../model/user_model");
const Student = require("../model/studentModel");
const Course = require("../model/course_model");
const { sendCoursePurchaseEmail, sendAdminCoursePurchaseNotification } = require("../middleware/mailService");
const Coupon = require("../model/couponModel");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ────────────────────────────────────────────────────────────────────────────
 *  CREATE ORDER + PAYMENT-LINK
 * ────────────────────────────────────────────────────────────────────────── */
exports.createOrder = async (req, res) => {
  const { userRef, courseRef, amountPaid, paymentType, callback_url, couponApplied, couponRef, couponDiscount } =
    req.body;

  try {
    /* 1️⃣  Make sure user exists */
    const user = await User.findById(userRef);
    if (!user) return res.status(404).json({ error: "User not found" });

    /* 2️⃣  Create Razorpay *order* (just an amount container) */
    const order = await razorpay.orders.create({
      amount: amountPaid * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // auto-capture
    });

    /* 3️⃣  Generate a payment-link tied to that order */
    const paymentLink = await razorpay.paymentLink.create({
      amount: amountPaid * 100,
      currency: "INR",
      accept_partial: false,
      reference_id: order.id,
      description: `Payment for course ${courseRef}`,
      customer: {
        name: user.displayName || "Customer",
        email: user.email,
        contact: user.phone || "9999999999",
      },
      notify: { sms: true, email: true },
      notes: {
        userRef,
        courseRef,
        paymentType,
        razorpay_order_id: order.id, // <-- we’ll need this later
      },
      reminder_enable: true,
      callback_url,
      callback_method: "get",
    });

    /* 4️⃣  Persist “pending” Payment record */
    const payment = await new Payment({
      userRef,
      courseRef,
      amountPaid,
      paymentType,
      transactionId: order.receipt,
      razorpay_order_id: order.id,
      razorpay_payment_link_id: paymentLink.id,
      razorpay_reference_id: paymentLink.reference_id,
      payment_link: paymentLink.short_url,
      status: "created",
      couponApplied,
      couponRef: couponApplied ? couponRef : null,
      couponDiscount: couponApplied ? couponDiscount : 0
    }).save();

    /* 5️⃣  Return data to frontend */
    res.json({
      success: true,
      orderId: order.id,
      paymentLink: paymentLink.short_url,
      paymentLinkId: paymentLink.id,
      referenceId: paymentLink.reference_id,
      paymentDocId: payment._id,
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

/* ────────────────────────────────────────────────────────────────────────────
 *  RAZORPAY WEBHOOK HANDLER
 * ────────────────────────────────────────────────────────────────────────── */
exports.handleWebhook = async (req, res) => {
  const tsISO = new Date().toISOString();
  const sigHeader = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  /* 0️⃣  Log raw payload (comment-out in prod) */
  console.log(`\n📨  Razorpay webhook @ ${tsISO}`);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body (raw):", req.body.toString());

  /* 1️⃣  Verify HMAC signature */
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(req.body) // Buffer, because route uses express.raw()
    .digest("hex");

  console.log("Expected-HMAC:", expectedSig);
  console.log("Received-HMAC:", sigHeader);

  if (expectedSig !== sigHeader) {
    console.error("❌  Signature mismatch – ignoring webhook");
    return res.status(400).send("Invalid signature");
  }

  /* 2️⃣  Parse payload */
  let payload;
  try {
    payload = JSON.parse(req.body);
  } catch (err) {
    console.error("❌  Malformed JSON in webhook:", err);
    return res.status(400).send("Malformed JSON");
  }

  const { event } = payload;
  console.log(`⚡  Event → ${event}`);

  /* ─────────────────────────────────────────────────────────── HELPERS ─── */
  const findPayment = async ({ linkId, orderId }) => {
    // 1. by payment-link ID
    if (linkId) {
      const p = await Payment.findOne({ razorpay_payment_link_id: linkId });
      if (p) return p;
    }
    // 2. by original order ID stored when link was created
    if (orderId) {
      const p = await Payment.findOne({ razorpay_order_id: orderId });
      if (p) return p;
    }
    return null;
  };

  const recordSuccess = async ({ linkId, orderId, payId }) => {
    console.log(
      `➡️  SUCCESS linkId=${linkId} orderId=${orderId} payId=${payId}`
    );
    const payment = await findPayment({ linkId, orderId });
    if (!payment) {
      console.warn("⚠️  No Payment doc matched", { linkId, orderId });
      return;
    }

    payment.status = "success";
    payment.transactionId = payId;
    payment.razorpay_payment_id = payId;
    await payment.save();
    console.log("✅  Payment doc updated:", payment._id);

    await User.findByIdAndUpdate(payment.userRef, {
      $push: {
        subscription: {
          payment_id: payment._id,
          payment_Status: "success",
          course_enrolled: payment.courseRef,
          is_subscription_active: true,
          created_at: new Date(),
        }
      }
    },
      { new: true },
    );
    const course = await Course.findByIdAndUpdate(payment.courseRef,
      {
        $addToSet: {
          student_enrolled: payment.userRef
        }
      },
      { new: true }
    );
    const coupon = await Coupon.findById(payment.couponRef);
    if (coupon) {
      await Coupon.findByIdAndUpdate(payment.couponRef,
        {
          $addToSet: {
            applied_users: payment.userRef
          }
        },
        { new: true }
      );
    }
    const user = await User.findById(payment.userRef);
    await sendCoursePurchaseEmail(
      user.displayName,
      user.email,
      course.name,
      payment.amountPaid,
      payId
    );
    const userAdmin = await User.find({ role: "admin" });
    await Promise.all(userAdmin.map(async (admin) => {
      await sendAdminCoursePurchaseNotification(
        user.displayName,
        user.email,
        course.name,
        payment.amountPaid,
        payId,
        admin.email,
      );
    }))

    // await upsertStudent({
    //   userRef: payment.userRef,
    //   courseRef: payment.courseRef, // field already saved in Payment
    //   payId,
    // });
    console.log("✅  User subscription activated for", payment.userRef);
  };

  const recordFailure = async ({ linkId, orderId, reason }) => {
    console.log(
      `➡️  FAILURE linkId=${linkId} orderId=${orderId} reason=${reason}`
    );
    const payment = await findPayment({ linkId, orderId });
    if (!payment) {
      console.warn("⚠️  No Payment doc matched", { linkId, orderId });
      return;
    }

    payment.status = "failed";
    payment.failure_reason = reason;
    await payment.save();
    console.log("✅  Payment marked failed:", payment._id);

    // await User.findByIdAndUpdate(payment.userRef, {
    //   $push: {
    //     subscription: {
    //       payment_id: payment._id,
    //       payment_Status: "success",
    //       course_enrolled: payment.courseRef,
    //       is_subscription_active: true,
    //       created_at: new Date(),
    //     }
    //   }
    // },
    //   { new: true },
    // );
    console.log("✅  User subscription de-activated for", payment.userRef);
  };

  /* ─────────────────────────────────────────────────────────── ROUTING ─── */
  try {
    switch (event) {
      /* ---------- SUCCESS-type events ---------- */
      case "payment_link.paid": {
        const link = payload.payload.payment_link.entity;
        await recordSuccess({
          linkId: link.id,
          orderId: link.notes?.razorpay_order_id,
          payId: link.payment_id,
        });
        break;
      }

      // case "payment.authorized":
      // case "order.paid":
      case "payment.captured": {
        const pay = payload.payload.payment.entity;
        console.log("✅  Payment captured:", pay);
        await recordSuccess({
          linkId: pay.notes?.razorpay_payment_link_id, // usually undefined
          orderId: pay.notes?.razorpay_order_id || pay.order_id, // order we stored OR Razorpay’s
          payId: pay.id,
        });
        break;
      }

      /* ---------- FAILURE-type events ---------- */
      case "payment_link.failed": {
        const link = payload.payload.payment_link.entity;
        await recordFailure({
          linkId: link.id,
          orderId: link.notes?.razorpay_order_id,
          reason: link.failure_reason || "unknown",
        });
        break;
      }

      /* ---------- Unknown / ignored ---------- */
      default:
        console.log("ℹ️  Unhandled event – nothing to do");
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("❌  Webhook processing error:", err);
    res.status(500).send("Internal webhook error");
  }
};

/* ------------------------------------------------------------
 * Upsert Student record when a payment is confirmed
 * ---------------------------------------------------------- */
const upsertStudent = async ({ userRef, courseRef, payId }) => {
  // shape that matches the sub-schema inside Student.courseRef[]
  const courseObj = {
    courseRef,
    subscribe_status: "active",
    payment_status: "paid",
    payment_id: payId,
    kyc_status: "not-applied",
  };

  let student = await Student.findOne({ userRef });

  if (!student) {
    /* First purchase → create the Student doc */
    student = new Student({
      userRef,
      courseRef: [courseObj], // <-- triggers isEnrolled=true via pre('save')
    });
  } else {
    /* Returning customer → update / push the course node */
    const idx = student.courseRef.findIndex(
      (c) => c.courseRef.toString() === courseRef.toString()
    );

    if (idx === -1) {
      student.courseRef.push(courseObj);
    } else {
      Object.assign(student.courseRef[idx], courseObj); // refresh payment data
    }
  }

  await student.save(); // middleware runs → isEnrolled stays accurate
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const payment = await Payment.findById(id)
      .populate("userRef", "displayName email")
      .populate("courseRef", "title");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error("Error checking payment status:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate("userRef",)
      .populate("courseRef")
      .populate("couponRef");

    if (!payments || payments.length === 0) {
      return res.status(404).json({ message: "No payments found" });
    }

    res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error("Error fetching all payments:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const payment = await Payment.findById(id)
      .populate("userRef", "displayName email")
      .populate("courseRef", "title")
      .populate("couponRef");


    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error("Error fetching payment by ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.getPayemntByCourseId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const payments = await Payment.find({ courseRef: id })
      .populate("userRef", "displayName email")
      .populate("courseRef", "title")
      .populate("couponRef");



    res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error("Error fetching payments by course ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}