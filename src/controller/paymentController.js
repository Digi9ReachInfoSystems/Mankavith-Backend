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
    // 1. Fetch user details from database
    const user = await User.findById(userRef);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Create Razorpay order
    const options = {
      amount: amountPaid * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);

    // 3. Generate payment link with actual user details
    const paymentLink = await razorpay.paymentLink.create({
      amount: amountPaid * 100,
      currency: "INR",
      accept_partial: false,
      reference_id: order.id,
      description: `Payment for course ${courseRef}`,
      customer: {
        name: user.displayName || "Customer", // Fallback if displayName not set
        email: user.email, // Use actual user email
        contact: user.phone || "9999999999", // Fallback if phone not set
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
      },
      callback_url,
      callback_method: "get",
    });

    // 4. Save payment record
    const payment = new Payment({
      userRef,
      courseRef,
      amountPaid,
      transactionId: order.receipt, // Fixed typo in 'receipt'
      paymentType,
      razorpay_order_id: order.id,
      razorpay_payment_link_id: paymentLink.id,
      payment_link: paymentLink.short_url,
      status: "created",
    });

    await payment.save();

    // 5. Return response with payment link
    res.json({
      success: true,
      orderId: order.id,
      paymentLink: paymentLink.short_url,
      paymentLinkId: paymentLink.id,
    });
  } catch (err) {
    console.error("Payment Error:", err.error || err);
    res.status(500).json({
      error: "Payment processing failed",
      details: err.error?.description || err.message,
    });
  }
};
