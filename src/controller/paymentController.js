const Payment = require("../model/paymentModel");
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
