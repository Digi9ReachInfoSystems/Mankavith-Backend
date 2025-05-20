const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/user_model");
const nodemailer = require("nodemailer");
const Course = require("../model/course_model");
const mongoose = require("mongoose");
const Student = require("../model/studentModel");
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "Info@gully2global.com",
    pass: "Shasudigi@217",
  },
});

exports.register = async (req, res) => {
  const { email, password, confirmPassword, phone, name, role } = req.body;
  try {
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "email already exists" });
    }
    const validPhone = /^\d{10}$/.test(phone);
    if (!validPhone) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number format" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords and Confirm Password do not match",
      });
    }
    if (role !== "user" && role !== "admin") {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const passwordStrengthRegex =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/.test(password);
    console.log(passwordStrengthRegex);
    if (!passwordStrengthRegex) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long, include a number, an uppercase letter, and a special character.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 1);

    const newUser = new User({
      email,
      password: hashedPassword,
      phone,
      displayName: name,
      role,
      otp,
      otpExpiration,
      isEmailVerified: false,
    });

    const savedUser = await newUser.save();
    if (role === "user") {
      const student = new Student({
        userRef: savedUser._id,
        isEnrolled: false,
        courseRef: [],
      });
      await student.save();
    }

    const mailOptions = {
      from: "Info@gully2global.com",
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP is: ${otp}. It will expire in 1 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .json({ success: false, message: "Error sending OTP" });
      }
      res.status(201).json({
        success: true,
        message:
          "User registered successfully. OTP has been sent to your email.",
      });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    if (email == undefined || email == "" || email == null) {
      return res
        .status(400)
        .json({ success: false, message: "email cannot be empty " });
    }

    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    if (password == undefined || password == "" || password == null) {
      return res
        .status(400)
        .json({ success: false, message: "password cannot be empty " });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account with this email does not exist",
      });
    }
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const expiryTime = Date.now() + 3600 * 1000;
    const expiryDate = new Date(expiryTime);

    const accessToken = jwt.sign(
      { username: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    user.accessToken = accessToken;
    const refreshToken = jwt.sign(
      { username: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    user.refreshToken = refreshToken;
    await user.save();
    let student;
    if (user.role === "user") {
      student = await Student.findOne({ userRef: user._id });
    }
    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: user,
      kyc_status: user.role === "user" ? student.kyc_status : null,
      expiresIn: expiryDate,
    });
  } catch (error) {
    console.error("error", error);
    res
      .status(500)
      .json({ success: false, message: "Login failed", error: error.message });
  }
};
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    if (otp == undefined || otp == "" || otp == null) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is required" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiration) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiration = undefined;
    const accessToken = jwt.sign(
      { username: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { username: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      accessToken,
      refreshToken,
      user: user,
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
    });
  }
};
exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const currentTime = new Date();
    if (user.otpExpiration && currentTime < user.otpExpiration) {
      return res.status(200).json({
        success: false,
        message: "OTP is still valid. Please try again after it expires.",
        otpExpiration: user.otpExpiration.toISOString(),
      });
    }
    const otp = generateOTP();
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 1);

    user.otp = otp;
    user.otpExpiration = otpExpiration;

    await user.save();

    const mailOptions = {
      from: "Info@gully2global.com",
      to: email,
      subject: "Email Verification OTP",
      text: `Your new OTP is: ${otp}. It will expire in 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .json({ success: false, message: "Error sending OTP" });
      }
      res.status(200).json({
        success: true,
        message: "New OTP has been sent to your email",
      });
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Error resending OTP",
      error: error.message,
    });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, message: "No refresh token provided" });
  }

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Refresh token is expired or invalid",
        });
      }

      const newAccessToken = jwt.sign(
        { username: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({ success: true, accessToken: newAccessToken });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({
      success: false,
      message: "Error refreshing token",
      error: error.message,
    });
  }
};

exports.loginSendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account with this email does not exist",
      });
    }

    const loginOtp = generateOTP();
    const loginOtpExpiration = new Date();
    loginOtpExpiration.setMinutes(loginOtpExpiration.getMinutes() + 1);

    user.loginOtp = loginOtp;
    user.loginOtpExpiration = loginOtpExpiration;
    await user.save();

    const mailOptions = {
      from: "Info@gully2global.com",
      to: email,
      subject: "Login Verification OTP",
      text: `Your login OTP is: ${loginOtp}. It will expire in 1 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .json({ success: false, message: "Error sending OTP" });
      }
      res.status(200).json({
        success: true,
        message: "Login OTP has been sent to your email",
      });
    });
  } catch (error) {
    console.error("Error sending login OTP:", error);
    res.status(500).json({
      success: false,
      message: "Error sending login OTP",
      error: error.message,
    });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  const { email, loginOtp } = req.body;
  try {
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account with this email does not exist",
      });
    }

    if (user.loginOtp !== loginOtp) {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    if (user.loginOtpExpiration < new Date()) {
      return res
        .status(401)
        .json({ success: false, message: "OTP has expired" });
    }
    const expiryTime = Date.now() + 3600 * 1000;
    const expiryDate = new Date(expiryTime);
    const accessToken = jwt.sign(
      { username: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { username: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    user.refreshToken = refreshToken;
    await user.save();
    let student;
    if (user.role === "user") {
      student = await Student.findOne({ userRef: user._id });
    }
    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: user,
      kyc_status: user.role === "user" ? student.kyc_status : null,
      expiresIn: expiryDate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying login OTP",
      error: error.message,
    });
  }
};

exports.resendLoginOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account with this email does not exist",
      });
    }

    const loginOtp = generateOTP();
    const loginOtpExpiration = new Date();
    loginOtpExpiration.setMinutes(loginOtpExpiration.getMinutes() + 1);

    user.loginOtp = loginOtp;
    user.loginOtpExpiration = loginOtpExpiration;
    await user.save();

    const mailOptions = {
      from: "Info@gully2global.com",
      to: email,
      subject: "Login Verification OTP",
      text: `Your login OTP is: ${loginOtp}. It will expire in 1 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .json({ success: false, message: "Error sending OTP" });
      }
      res.status(200).json({
        success: true,
        message: "Login OTP has been sent to your email",
      });
    });
  } catch (error) {
    console.error("Error sending login OTP:", error);
    res.status(500).json({
      success: false,
      message: "Error sending login OTP",
      error: error.message,
    });
  }
};
exports.logout = async (req, res) => {
  try {
    const { email } = req.body;
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account with this email does not exist",
      });
    }
    user.refreshToken = undefined;
    user.accessToken = undefined;
    await user.save();
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging out",
      error: error.message,
    });
  }
};
exports.createAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({ email, password: hashedPassword, role: "admin" });
    await admin.save();
    res
      .status(200)
      .json({ success: true, message: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating admin",
      error: error.message,
    });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User found", user: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting user",
      error: error.message,
    });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    res
      .status(200)
      .json({ success: true, message: "Users found", users: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting users",
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

exports.updateWishlist = async (req, res) => {
  try {
    const { userId, courseId, action } = req.body;

    // Validate required fields
    if (!userId || !courseId || !action) {
      return res.status(400).json({
        success: false,
        message: "userId, courseId, and action are required fields",
      });
    }

    // Validate action
    if (!["add", "remove"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'add' or 'remove'",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let update;
    let message;

    if (action === "add") {
      // Check if course already in wishlist
      if (user.wishList.includes(courseId)) {
        return res.status(400).json({
          success: false,
          message: "Course already in wishlist",
        });
      }
      update = { $addToSet: { wishList: courseId } };
      message = "Course added to wishlist successfully";
    } else {
      // Check if course exists in wishlist before removing
      if (!user.wishList.includes(courseId)) {
        return res.status(400).json({
          success: false,
          message: "Course not found in wishlist",
        });
      }
      update = { $pull: { wishList: courseId } };
      message = "Course removed from wishlist successfully";
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
    }).populate("wishList", "courseName price image");

    return res.status(200).json({
      success: true,
      message: message,
      data: {
        wishList: updatedUser.wishList,
        count: updatedUser.wishList.length,
      },
    });
  } catch (error) {
    console.error("Error updating wishlist:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update wishlist.",
      error: error.message,
    });
  }
};

// Get user wishlist
exports.getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate required field
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const user = await User.findById(userId).populate(
      "wishList",
      "courseName price image duration"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      count: user.wishList.length,
      data: user.wishList,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch wishlist.",
      error: error.message,
    });
  }
};

// Check if course is in wishlist
exports.checkWishlistItem = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    // Validate required fields
    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "userId and courseId are required",
      });
    }

    const user = await User.findOne({
      _id: userId,
      wishList: courseId,
    });

    return res.status(200).json({
      success: true,
      isInWishlist: !!user,
    });
  } catch (error) {
    console.error("Error checking wishlist item:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not check wishlist item.",
      error: error.message,
    });
  }
};
