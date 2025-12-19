const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/user_model");
const nodemailer = require("nodemailer");
const Course = require("../model/course_model");
const mongoose = require("mongoose");
const Student = require("../model/studentModel");
const UserProgress = require("../model/userProgressModel");
const KycDetails = require("../model/kycDetails");
const Support = require("../model/supportModel");
const CourseProgress = require("../model/courseProgressModel");
const UserAttempt = require("../model/userAttemptModel");
const MockTest = require("../model/mockTestModel");
const UserRanking = require("../model/userRankingModel");
const Payments = require("../model/paymentModel");
const Certificate = require("../model/certificatesModel");
const Feedback = require("../model/feedback");
const axios = require("axios");
const Subject = require("../model/subject_model");
const {
  sendWelcomeEmail,
  sendAdminNotification,
  sendQuestionPaperDownloadAlert,
  sendAdminPaperDownloadMail,
  sendwelcomeMailtoStudentAdminCreated,
  admincreateStudentMailtoadmins,
} = require("../middleware/mailService");
const MasterOtp = require("../model/masterOTPModel");
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  // secure: true,
  auth: {
    user: "mankavit.clatcoaching11@gmail.com",
    pass: "ADOJ6z04yjbaL9TY",
  },
});

exports.register = async (req, res) => {
  const { email, password, confirmPassword, phone, name, role } = req.body;
  try {
    const Email = req.body.email.toLowerCase();
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const existingUser = await User.findOne({ email: Email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "An account with this E-mail already exists" });
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
      email: Email,
      password: hashedPassword,
      phone,
      displayName: name,
      role,
      otp,
      otpExpiration,
      isEmailVerified: false,
      signedUpAt: new Date(),
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

    //mail otp on signup

    // const mailOptions = {
    //   from: "mankavit.clatcoaching11@gmail.com",
    //   to: email,
    //   subject: "Email Verification OTP",
    //   text: `Your OTP is: ${otp}. It will expire in 1 minutes.`,
    // };

    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.error("Error sending email:", error);
    //     return res
    //       .status(500)
    //       .json({ success: false, message: "Error sending OTP" });
    //   }
    //   res.status(201).json({
    //     success: true,
    //     message:
    //       "User registered successfully. OTP has been sent to your email.",
    //   });
    // });

    const user = await User.findOne({ email: Email });
    const otpPhone = Math.floor(100000 + Math.random() * 900000);
    const response = await axios.post("https://control.msg91.com/api/v5/otp", {
      otp_expiry: 1,
      template_id: "6835b4f2d6fc053de8172342",
      mobile: `91${user.phone}`,
      authkey: process.env.MSG91_AUTH_KEY,
      otp: otpPhone,
      realTimeResponse: 1,
    });
    await sendWelcomeEmail(user.displayName, user.email);
    const adminUser = await User.find({ role: "admin", isSuperAdmin: true });

    await sendAdminNotification(user.displayName, user.email, user.phone, "mankavit.clatcoaching11@gmail.com");



    if (response.data.type == "success") {
      res.status(200).json({
        success: true,
        message:
          "User registered successfully. OTP has been sent to your Phone.",
        user: savedUser,
        data: response.data,
      });
    }
    if (response.data.type == "error") {
      return res.status(400).json({
        success: false,
        message: response.data.message,
        data: response.data,
      });
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
};

// helper to save FCM token safely
// utils/saveFcmTokenIfPresent.js
const saveFcmTokenIfPresent = async (user, fcmToken, device, platform) => {
  if (!fcmToken || !user) return;

  const deviceId = device?.deviceId || null;
  const platformSafe = platform || device?.deviceType || "unknown";

  // 1️⃣ If token already exists → DO NOTHING
  const tokenExists = user.fcmTokens.some(t => t.token === fcmToken);
  if (tokenExists) {
    return;
  }

  // 2️⃣ If same deviceId exists → UPDATE token
  if (deviceId) {
    const deviceIndex = user.fcmTokens.findIndex(
      t => t.deviceId && t.deviceId === deviceId
    );

    if (deviceIndex !== -1) {
      user.fcmTokens[deviceIndex].token = fcmToken;
      user.fcmTokens[deviceIndex].platform = platformSafe;
      user.fcmTokens[deviceIndex].createdAt = new Date();
      await user.save();
      return;
    }
  }

  // 3️⃣ Otherwise → ADD new token
  user.fcmTokens.push({
    token: fcmToken,
    deviceId,
    platform: platformSafe,
    createdAt: new Date(),
  });

  await user.save();
};




/*************  ✨ Windsurf Command ⭐  *************/
/**
 * @function login
 * @description Logs in a user. If the user is already logged in on another device, it will return a forceLoginData which can be used to login the user on another device.
 * @param {Object} req.body - The request body containing the email, password, device and fcmToken.
 * @param {Object} res - The response object.
 * @returns {Object} - A JSON response containing a success status, a message, and an accessToken, refreshToken, and expiresIn if the login is successful.
 * @throws {Object} - A JSON response containing a success status, a message, and an error if the login fails.
 */
/*******  8048b15e-3d56-4bba-8d42-b4c8e17dc0cc  *******/
exports.login = async (req, res) => {
  const { email, password, device, fcmToken, platform } = req.body;
  const Email = email?.toLowerCase();

  try {
    // ────────────── validations ──────────────
    if (!Email) {
      return res.status(400).json({
        success: false,
        message: "E-mail cannot be empty",
      });
    }

    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email);
    if (!validMail) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password cannot be empty",
      });
    }

    const user = await User.findOne({ email: Email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account with this email does not exist",
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isBlocked) {
      return res.status(401).json({
        success: false,
        message:
          "Account is blocked please contact Support Team :- mankavit.clatcoaching11@gmail.com",
      });
    }

    // ────────────── CASE 1: fresh login / expired session ──────────────
    if (!user.device || user?.device?.refreshTokenExpiry < Date.now()) {
      const expiryTime = Date.now() + 3600 * 1000;
      const expiryDate = new Date(expiryTime);

      const refreshToken = jwt.sign(
        { username: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const accessToken = jwt.sign(
        { username: user.email, role: user.role, refreshToken },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      user.isActive = true;

      user.device = {
        deviceId: device?.deviceId,
        deviceType: device?.deviceType,
        browser_name: device?.browser_name,
        userAgent: device?.userAgent,
        ipAddress: device?.ipAddress,
        lastLogin: Date.now(),
        refreshTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
        isCurrent: true,
      };

      user.lastLogin = Date.now();
      await user.save();

      // 🔔 SAVE FCM TOKEN HERE
      await saveFcmTokenIfPresent(user, fcmToken, device, platform);

      let student = null;
      if (user.role === "user") {
        student = await Student.findOne({ userRef: user._id });
      }

      return res.status(200).json({
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
        alreadyLoggedIn: false,
        user,
        kyc_status: user.role === "user" ? user.kyc_status : null,
        expiresIn: expiryDate,
      });
    }

    // ────────────── CASE 2: same device login ──────────────
    if (
      user.device &&
      user?.device?.deviceId === device?.deviceId &&
      user?.device?.ipAddress === device?.ipAddress
    ) {
      const expiryTime = Date.now() + 3600 * 1000;
      const expiryDate = new Date(expiryTime);

      const refreshToken = jwt.sign(
        { username: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const accessToken = jwt.sign(
        { username: user.email, role: user.role, refreshToken },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save();

      // 🔔 SAVE FCM TOKEN HERE
      await saveFcmTokenIfPresent(user, fcmToken, device, platform);

      let student = null;
      if (user.role === "user") {
        student = await Student.findOne({ userRef: user._id });
      }

      return res.status(200).json({
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken: user.refreshToken,
        alreadyLoggedIn: false,
        user,
        kyc_status: user.role === "user" ? user.kyc_status : null,
        expiresIn: expiryDate,
      });
    }

    // ────────────── CASE 3: logged in on another device ──────────────
    const forceLoginData = jwt.sign(
      { device, email, password },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: false,
      message: "Already logged in on another device",
      alreadyLoggedIn: true,
      currentDevice: user.device,
      forceLoginData,
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};



// exports.login = async (req, res) => {
//   const { email, password, device } = req.body;
//   // console.log(email, password, device);
//   const Email = email.toLowerCase();
//   try {
//     if (Email == undefined || Email == "" || Email == null) {
//       return res
//         .status(400)
//         .json({ success: false, message: "E-mail cannot be empty " });
//     }

//     const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email);
//     if (!validMail) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid email format" });
//     }
//     if (password == undefined || password == "" || password == null) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Password cannot be empty " });
//     }
//     const user = await User.findOne({ email: Email });
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Account with this email does not exist",
//       });
//     }
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res
//         .status(401)
//         .json({ success: false, message: "Invalid email or password" });
//     }
//     if (user.isBlocked) {
//       return res.status(401).json({
//         success: false,
//         message:
//           "Account is blocked please contact Support Team :- mankavit.clatcoaching11@gmail.com",
//       });
//     }
//     // if (user.deviceId && user.deviceId !== deviceId) {
//     //   return res.status(403).json({ success: false, message: "Already logged in on another device" });
//     // }
//     if (!user.device || user?.device?.refreshTokenExpiry < Date.now()) {
//       const expiryTime = Date.now() + 3600 * 1000;
//       const expiryDate = new Date(expiryTime);
//       const refreshToken = jwt.sign(
//         { username: user.email, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: "7d" }
//       );

//       const accessToken = jwt.sign(
//         { username: user.email, role: user.role, refreshToken },
//         process.env.JWT_SECRET,
//         { expiresIn: "1h" }
//       );
//       user.accessToken = accessToken;

//       user.refreshToken = refreshToken;
//       user.isActive = true;
//       await user.save();
//       let student;
//       if (user.role === "user") {
//         student = await Student.findOne({ userRef: user._id });
//       }
//       user.device = {
//         deviceId: device.deviceId,
//         deviceType: device.deviceType,
//         browser_name: device.browser_name,
//         userAgent: device.userAgent,
//         ipAddress: device.ipAddress,
//         lastLogin: Date.now(),
//         refreshTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
//         isCurrent: true,
//       };
//       user.lastLogin = Date.now();
//       await user.save();
//       res.status(200).json({
//         success: true,
//         message: "Login successful",
//         accessToken,
//         refreshToken,
//         alreadyLoggedIn: false,
//         user: user,
//         kyc_status: user.role === "user" ? user.kyc_status : null,
//         expiresIn: expiryDate,
//       });
//     } else if (
//       user.device &&
//       user?.device?.deviceId === device.deviceId &&
//       user?.device?.ipAddress === device.ipAddress
//     ) {
//       const expiryTime = Date.now() + 3600 * 1000;
//       const expiryDate = new Date(expiryTime);
//       const refreshToken = jwt.sign(
//         { username: user.email, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: "7d" }
//       );

//       const accessToken = jwt.sign(
//         { username: user.email, role: user.role, refreshToken },
//         process.env.JWT_SECRET,
//         { expiresIn: "1h" }
//       );
//       user.accessToken = accessToken;

//       user.refreshToken = refreshToken;
//       await user.save();
//       let student;
//       if (user.role === "user") {
//         student = await Student.findOne({ userRef: user._id });
//       }
//       res.status(200).json({
//         success: true,
//         message: "Login successful",
//         accessToken,
//         alreadyLoggedIn: false,
//         refreshToken: user.refreshToken,
//         user: user,
//         kyc_status: user.role === "user" ? user.kyc_status : null,
//         expiresIn: expiryDate,
//       });
//     } else {
//       const forceLoginData = jwt.sign(
//         { device: device, email: email, password: password },
//         process.env.JWT_SECRET,
//         { expiresIn: "1h" }
//       );
//       return res.status(200).json({
//         success: false,
//         message: "Already logged in on another device",
//         alreadyLoggedIn: true,
//         currentDevice: user.device,
//         forceLoginData,
//       });
//     }
//   } catch (error) {
//     console.error("error", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Login failed", error: error.message });
//   }
// };

exports.forceLogin = async (req, res) => {
  try {
    const { forceLoginData } = req.body;
    if (!forceLoginData) {
      return res
        .status(400)
        .json({ success: false, message: "forceLoginData is required" });
    }
    const decoded = jwt.verify(forceLoginData, process.env.JWT_SECRET);
    const { email, password, device } = decoded;
    if (!email || !password || !device) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid forceLoginData" });
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
        .json({ success: false, message: "Invalid email or password" });
    }
    const expiryTime = Date.now() + 3600 * 1000;
    const expiryDate = new Date(expiryTime);
    const refreshToken = jwt.sign(
      { username: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const accessToken = jwt.sign(
      { username: user.email, role: user.role, refreshToken },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    user.refreshToken = refreshToken;
    user.accessToken = accessToken;
    user.lastLogin = Date.now();
    user.isActive = true;
    await user.save();
    let student;
    if (user.role === "user") {
      student = await Student.findOne({ userRef: user._id });
    }
    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken: user.refreshToken,
      user: user,
      alreadyLoggedIn: false,
      kyc_status: user.role === "user" ? user.kyc_status : null,
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
  const Email = email.toLowerCase();

  try {
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email);
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
    const user = await User.findOne({ email: Email });

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
      { username: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { username: user.email, role: user.role },
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
  const Email = email.toLowerCase();

  try {
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const user = await User.findOne({ email: Email });
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
      from: "mankavit.clatcoaching11@gmail.com",
      to: Email,
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
      .status(405)
      .json({ success: false, message: "No refresh token provided" });
  }

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res
        .status(405)
        .json({ success: false, message: "Invalid refresh token" });
    }
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        user.deviceId = null;
        user.refreshToken = null;
        user.device = null; // Clear device information
        user.save();
        return res.status(405).json({
          success: false,
          message: "Refresh token is expired or invalid",
        });
      }
      user.isActive = true;
      user.lastActive = Date.now();
      const newAccessToken = jwt.sign(
        { username: user.email, role: user.role, refreshToken },
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
    const Email = email.toLowerCase();
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const user = await User.findOne({ email: Email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account with this email does not exist",
      });
    }

    const loginOtp = generateOTP();
    const loginOtpExpiration = new Date();
    loginOtpExpiration.setMinutes(loginOtpExpiration.getMinutes() + 2);

    user.loginOtp = loginOtp;
    user.loginOtpExpiration = loginOtpExpiration;
    await user.save();

    const mailOptions = {
      from: "mankavit.clatcoaching11@gmail.com",
      to: Email,
      subject: "Login Verification OTP",
      text: `Your login OTP is: ${loginOtp}. It will expire in 2 minutes.`,
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
  const { email, loginOtp, device } = req.body;
  const Email = email.toLowerCase();
  try {
    const masterOtp = await MasterOtp.findOne();
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const user = await User.findOne({ email: Email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account with this email does not exist",
      });
    }
    if (loginOtp === masterOtp.otp) {
      if (user.isBlocked) {
        return res.status(401).json({
          success: false,
          message:
            "Account is blocked please contact Support Team :- mankavit.clatcoaching11@gmail.com",
        });
      }
      const expiryTime = Date.now() + 3600 * 1000;
      const expiryDate = new Date(expiryTime);
      const refreshToken = jwt.sign(
        { username: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      const accessToken = jwt.sign(
        { username: user.email, role: user.role, refreshToken },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      // const refreshToken = jwt.sign(
      //   { username: user.email, role: user.role },
      //   process.env.JWT_SECRET,
      //   { expiresIn: "7d" }
      // );
      user.refreshToken = refreshToken;
      user.isActive = true;
      await user.save();
      let student;
      if (user.role === "user") {
        student = await Student.findOne({ userRef: user._id });
      }
      user.device = {
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        browser_name: device.browser_name,
        userAgent: device.userAgent,
        ipAddress: device.ipAddress,
        lastLogin: Date.now(),
        refreshTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        isCurrent: true,
      };
      user.lastLogin = Date.now();
      await user.save();
      res.status(200).json({
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
        alreadyLoggedIn: false,
        user: user,
        kyc_status: user.role === "user" ? user.kyc_status : null,
        expiresIn: expiryDate,
      });
    } else {
      if (user.loginOtp !== loginOtp) {
        return res.status(403).json({ success: false, message: "Invalid OTP" });
      }

      if (user.loginOtpExpiration < new Date()) {
        return res
          .status(403)
          .json({ success: false, message: "OTP has expired" });
      }

      if (user.isBlocked) {
        return res.status(401).json({
          success: false,
          message:
            "Account is blocked please contact Support Team :- mankavit.clatcoaching11@gmail.com",
        });
      }
      // if (user.deviceId && user.deviceId !== deviceId) {
      //   return res.status(403).json({ success: false, message: "Already logged in on another device" });
      // }
      const expiryTime = Date.now() + 3600 * 1000;
      const expiryDate = new Date(expiryTime);
      const refreshToken = jwt.sign(
        { username: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      const accessToken = jwt.sign(
        { username: user.email, role: user.role, refreshToken },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      // const refreshToken = jwt.sign(
      //   { username: user.email, role: user.role },
      //   process.env.JWT_SECRET,
      //   { expiresIn: "7d" }
      // );
      user.refreshToken = refreshToken;
      user.isActive = true;
      await user.save();
      let student;
      if (user.role === "user") {
        student = await Student.findOne({ userRef: user._id });
      }
      user.device = {
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        browser_name: device.browser_name,
        userAgent: device.userAgent,
        ipAddress: device.ipAddress,
        lastLogin: Date.now(),
        refreshTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        isCurrent: true,
      };
      user.lastLogin = Date.now();
      await user.save();
      res.status(200).json({
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
        alreadyLoggedIn: false,
        user: user,
        kyc_status: user.role === "user" ? user.kyc_status : null,
        expiresIn: expiryDate,
      });
    }
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
  const Email = email.toLowerCase();

  try {
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const user = await User.findOne({ email: Email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account with this email does not exist",
      });
    }

    const loginOtp = generateOTP();
    const loginOtpExpiration = new Date();
    loginOtpExpiration.setMinutes(loginOtpExpiration.getMinutes() + 2);

    user.loginOtp = loginOtp;
    user.loginOtpExpiration = loginOtpExpiration;
    await user.save();

    const mailOptions = {
      from: "mankavit.clatcoaching11@gmail.com",
      to: Email,
      subject: "Login Verification OTP",
      text: `Your login OTP is: ${loginOtp}. It will expire in 2 minutes.`,
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
    const Email = email.toLowerCase();
    const validMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email);
    if (!validMail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const user = await User.findOne({ email: Email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account with this email does not exist",
      });
    }
    user.deviceId = undefined;
    user.refreshToken = undefined;
    user.accessToken = undefined;
    user.device = undefined; // Clear device information
    user.lastLogin = null;
    user.lastActive = null;
    user.isActive = false;

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
    const user = await User.findById(id).populate(
      "subscription.course_enrolled"
    );
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
    const users = await User.find({ role: "user" })
      .populate("wishList")
      .populate({
        path: "subscription",
        populate: [{ path: "payment_id" }, { path: "course_enrolled" }],
      })
      .populate("kycRef");
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
    }).populate("wishList");

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

    const user = await User.findById(userId).populate("wishList");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    let wishList = await Promise.all(
      user.wishList.map(async (item) => {
        const course = await Course.findById({
          _id: item._id,
          isPublished: true,
        });
        if (course && course.isPublished) {
          return course;
        } else {
          return null;
        }
      })
    );
    wishList = wishList.filter((course) => course !== null);
    user.wishList = wishList.map((item) => item._id);
    await user.save();

    return res.status(200).json({
      success: true,
      count: wishList.length,
      data: wishList,
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
exports.editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    let updateData = req.body;
    if (req.body.email) {
      if (user.email != req.body.email.trim().toLowerCase()) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }
        req.body.email = req.body.email.toLowerCase();

        updateData = {
          ...updateData,
          email: req.body.email.toLowerCase(),
          refreshToken: null,
        };
      }

    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update user.",
      error: error.message,
    });
  }
};

exports.getAllEnrolledCourses = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "subscription.course_enrolled"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // if (user.kyc_status !== "approved") return res.status(200).json({ success: true, enrolledCourses: [], message: "Please complete kyc to view Course" });
    if (!user.subscription)
      return res.status(200).json({ success: true, enrolledCourses: [] });
    let subscribedCourses = user.subscription;
    subscribedCourses = await Promise.all(
      user.subscription.map(async (sub) => {
        const course = await Course.findOne({
          _id: sub.course_enrolled,
          // courseExpiry: { $gt: new Date() },
          isPublished: true,
        });
        if (course) {
          return course;
        } else {
          return null;
        }
      })
    );
    subscribedCourses = subscribedCourses.filter((course) => course !== null);
    subscribedCourses = subscribedCourses.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    })
    let enrolledCourses = user.subscription.map((sub) => sub.course_enrolled);
    const userProgress = await UserProgress.findOne({ user_id: userId });
    if (!userProgress) {
      enrolledCourses = enrolledCourses.map((course) => {
        const plainCourse = course.toObject();
        return {
          ...plainCourse,
          course_status: "Not started",
          completePercentage: 0,
          kycStatus: course.isKycRequired
            ? user.kyc_status === "approved"
              ? true
              : false
            : true,
          userKycStatus: user.kyc_status,
        };
      });
      return res.status(200).json({ success: true, enrolledCourses });
    }

    enrolledCourses = await Promise.all(
      subscribedCourses.map((course) => {
        const plainCourse = course.toObject();
        const courseProgress = userProgress.courseProgress.find((progress) =>
          progress.course_id.equals(course._id)
        );
        if (courseProgress) {
          return {
            ...plainCourse,
            course_status: courseProgress.status,
            completePercentage: courseProgress.completedPercentage,
            kycStatus: course.isKycRequired
              ? user.kyc_status === "approved"
                ? true
                : false
              : true,
            userKycStatus: user.kyc_status,
          };
        } else {
          return {
            ...plainCourse,
            course_status: "Not started",
            completePercentage: 0,
            kycStatus: course.isKycRequired
              ? user.kyc_status === "approved"
                ? true
                : false
              : true,
            userKycStatus: user.kyc_status,
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      message: "Subscribed courses fetched successfully",
      enrolledCourses,
    });
  } catch (error) {
    console.error("Error fetching subscribed courses:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch subscribed courses.",
      error: error.message,
    });
  }
};

exports.getOngoingCourses = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "subscription.course_enrolled"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // if (user.kyc_status !== "approved")
    //   return res.status(200).json({
    //     success: true,
    //     enrolledCourses: [],
    //     message: "Please complete kyc to view Course",
    //   });
    if (!user.subscription)
      return res.status(200).json({ success: true, enrolledCourses: [] });
    const userProgress = await UserProgress.findOne({ user_id: userId });
    if (!userProgress)
      return res.status(200).json({ success: true, enrolledCourses: [] });
    let subscribedCourses = user.subscription;
    subscribedCourses = await Promise.all(
      user.subscription.map(async (sub) => {
        const course = await Course.findOne({
          _id: sub.course_enrolled,
          // courseExpiry: { $gt: new Date() },
          isPublished: true,
        });
        if (course) {
          return course;
        } else {
          return null;
        }
      })
    );
    subscribedCourses = subscribedCourses.filter((course) => course !== null);
    subscribedCourses = subscribedCourses.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    })
    let enrolledCourses = user.subscription.map((sub) => sub.course_enrolled);

    let filteredCourses = await Promise.all(
      subscribedCourses.map((course) => {
        const plainCourse = course.toObject();
        const progress = userProgress.courseProgress.find((p) =>
          p.course_id.equals(course._id)
        );
        if (progress && progress.status === "ongoing") {
          return {
            ...plainCourse,
            course_status: progress.status,
            completePercentage: progress.completedPercentage,
            kycStatus: course.isKycRequired
              ? user.kyc_status === "approved"
                ? true
                : false
              : true,
            userKycStatus: user.kyc_status,
          };
        }
        return null;
      })
    );
    filteredCourses = filteredCourses.filter(Boolean);

    res.status(200).json({
      success: true,
      enrolledCourses: filteredCourses,
      message: "Ongoing courses fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching ongoing courses:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getCompletedCourses = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "subscription.course_enrolled"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // if (user.kyc_status !== "approved")
    //   return res.status(200).json({
    //     success: true,
    //     enrolledCourses: [],
    //     message: "Please complete kyc to view Course",
    //   });
    if (!user.subscription)
      return res.status(200).json({ success: true, enrolledCourses: [] });
    const userProgress = await UserProgress.findOne({ user_id: userId });
    if (!userProgress)
      return res.status(200).json({ success: true, enrolledCourses: [] });
    let subscribedCourses = user.subscription;
    subscribedCourses = await Promise.all(
      user.subscription.map(async (sub) => {
        const course = await Course.findOne({
          _id: sub.course_enrolled,
          // courseExpiry: { $gt: new Date() },
          isPublished: true,
        });
        if (course) {
          return course;
        } else {
          return null;
        }
      })
    );
    subscribedCourses = subscribedCourses.filter((course) => course !== null);
    subscribedCourses = subscribedCourses.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    })
    let enrolledCourses = user.subscription.map((sub) => sub.course_enrolled);

    let filteredCourses = await Promise.all(
      subscribedCourses.map((course) => {
        const plainCourse = course.toObject();
        const progress = userProgress.courseProgress.find((p) =>
          p.course_id.equals(course._id)
        );
        if (progress && progress.status === "completed") {
          return {
            ...plainCourse,
            course_status: progress.status,
            completePercentage: progress.completedPercentage,
            kycStatus: course.isKycRequired
              ? user.kyc_status === "approved"
                ? true
                : false
              : true,
            userKycStatus: user.kyc_status,
          };
        }
        return null;
      })
    );
    filteredCourses = filteredCourses.filter(Boolean);
    res.status(200).json({
      success: true,
      enrolledCourses: filteredCourses,
      message: "Completed courses fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching completed courses:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getNotStartedCourses = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "subscription.course_enrolled"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.kyc_status !== "approved")
      return res.status(200).json({
        success: true,
        enrolledCourses: [],
        message: "Please complete kyc to view Course",
      });
    if (!user.subscription)
      return res.status(200).json({ success: true, enrolledCourses: [] });

    const userProgress = await UserProgress.findOne({ user_id: userId });
    let enrolledCourses = user.subscription.map((sub) => sub.course_enrolled);

    let filteredCourses = await Promise.all(
      enrolledCourses.map((course) => {
        const plainCourse = course.toObject();
        const progress = userProgress?.courseProgress.find((p) =>
          p.course_id.equals(course._id)
        );
        if (!progress) {
          return {
            ...plainCourse,
            course_status: "Not started",
            completePercentage: 0,
          };
        }
        return null;
      })
    );
    filteredCourses = filteredCourses.filter(Boolean);
    filteredCourses = filteredCourses.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    })
    res.status(200).json({
      success: true,
      enrolledCourses: filteredCourses,
      message: "Not started courses fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching not started courses:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const {
      email,
      password,
      phone,
      name,
      role = "user",
      photo_url,
      first_name,
      last_name,
      age,
      id_proof,
      passport_photo,
      courseIds,
      fathers_name,
      fathers_occupation,
      current_occupation,
      present_address,
      passing_year,
      college_name,
      date_of_birth,
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      phone: phone,
      displayName: name,
      role,
      photo_url,
      isEmailVerified: true,

      // Add these fields 👇
      fathers_name,
      fathers_occupation,
      current_occupation,
      present_address,
      passing_year,
      college_name,
      date_of_birth,
    });
    console.log("Creating user:", user);

    const savedStudent = await user.save();

    const kycDetails = new KycDetails({
      userref: savedStudent._id,
      first_name,
      last_name,
      email,
      age,
      mobile_number: phone,
      id_proof,
      passport_photo,
      status: "approved",

      // 🔽 Newly added fields
      fathers_name,
      fathers_occupation,
      current_occupation,
      present_address,
      passing_year,
      college_name,
      date_of_birth,
    });

    const savedKyc = await kycDetails.save();

    const userEdit = await User.findById(savedStudent._id);
    userEdit.kycRef = kycDetails._id;
    userEdit.kyc_status = "approved";

    if (!userEdit.subscription) {
      userEdit.subscription = [];
    }

    for (const courseId of courseIds) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      if (!course.student_enrolled) course.student_enrolled = [];
      if (!course.student_enrolled.includes(userEdit._id)) {
        course.student_enrolled.push(userEdit._id);
      }

      await course.save();

      const found = userEdit.subscription.find((sub) =>
        sub.course_enrolled.equals(course._id)
      );
      if (!found) {
        userEdit.subscription.push({
          payment_id: null,
          payment_Status: "success",
          is_subscription_active: true,
          course_enrolled: course._id,
        });
      }
    }

    await userEdit.save();

    await sendwelcomeMailtoStudentAdminCreated(
      savedStudent.displayName,
      savedStudent.email,
      password
    );
    const admins = await User.find({ role: "admin" });

    await admincreateStudentMailtoadmins(
      savedStudent.displayName,
      savedStudent.email,
      phone,
      date_of_birth,
      age,
      college_name,
      passing_year,
      current_occupation,
      fathers_name,
      fathers_occupation,
      present_address,
      "mankavit.clatcoaching11@gmail.com"
    );

    res.status(200).json({
      success: true,
      message: "Student created successfully",
      user: userEdit,
      kycDetails: savedKyc,
    });
  } catch (error) {
    console.error("Error creating student:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "user" })
      .populate("wishList")
      .populate({
        path: "subscription",
        populate: [{ path: "payment_id" }, { path: "course_enrolled" }],
      })
      .populate("kycRef");
    res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      students,
    });
  } catch (error) {
    console.error("Error fetching students:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
exports.addCourseSubscriptionToStudent = async (req, res) => {
  try {
    const { userId, courseIds } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (!user.subscription) {
      user.subscription = []; // Initialize if undefined
    }
    for (const courseId of courseIds) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
      if (!course.student_enrolled) course.student_enrolled = [];
      if (!course.student_enrolled.includes(user._id)) {
        course.student_enrolled.push(user._id);
      }
      await course.save();
      const found = user.subscription.find((sub) =>
        sub.course_enrolled.equals(course._id)
      );
      if (!found) {
        user.subscription.push({
          payment_id: null,
          payment_Status: "success",
          is_subscription_active: true,
          course_enrolled: course._id,
          is_subscription_active: true,
          expires_at: new Date(
            new Date().setDate(new Date().getDate() + course.duration)
          ),
          created_at: new Date(),
        });
      }
    }
    await user.save();
    res.status(200).json({
      success: true,
      message: "Courses added to student successfully",
      user: user,
    });
  } catch (error) {
    console.error("Error adding courses to student:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.subscription.forEach(async (sub) => {
      const course = await Course.findById(sub.course_enrolled);
      const courseProgress = await CourseProgress.findOne({
        course_id: sub.course_enrolled,
      });
      courseProgress.progress.filter(
        (progress) => !progress.user_id.equals(id)
      );
      await courseProgress.save();
      if (course) {
        course.student_enrolled = course.student_enrolled.filter(
          (studentId) => !studentId.equals(id)
        );
        await course.save();
      }
    });
    const attempts = await UserAttempt.find({ userId: user._id });
    const deletedKyc = await KycDetails.findOneAndDelete({ userref: user._id });
    const deletedSupport = await Support.find({ userRef: user._id });
    deletedSupport.forEach(async (support) => {
      await Support.findByIdAndDelete(support._id);
    });
    const userProgress = await UserProgress.findOneAndDelete({
      user_id: user._id,
    });
    const payments = await Payments.find({ userRef: user._id });
    payments.forEach(async (payment) => {
      await Payments.findByIdAndDelete(payment._id);
    });
    const certificates = await Certificate.find({ user_ref: user._id });
    certificates.forEach(async (certificate) => {
      await Certificate.findByIdAndDelete(certificate._id);
    });
    attempts.forEach(async (attemptID) => {
      const attempt = await UserAttempt.findByIdAndDelete(attemptID._id);
      const userRanking = await UserRanking.findOneAndDelete({
        userId: attempt.userId,
        subject: attempt.subject,
        bestAttemptId: attempt._id,
      });
      const userAttempts = await UserAttempt.find({
        userId: attempt.userId,
        attemptNumber: { $gt: attempt.attemptNumber },
        subject: attempt.subject,
      });
      for (let i = 0; i < userAttempts.length; i++) {
        userAttempts[i].attemptNumber -= 1;
        await userAttempts[i].save();
      }
      const result = await updateRankings(attempt);
    });
    const feedbacks = await Feedback.find({ userRef: user._id });
    feedbacks.forEach(async (feedback) => {
      const course = await Course.findById(feedback.courseRef);
      if (course) {
        course.student_feedback = course.student_feedback.filter(
          (feedbackId) => !feedbackId.equals(feedback._id)
        );
        await course.save();
      }
      await Feedback.findByIdAndDelete(feedback._id);
    });
    const deletedUser = await User.findByIdAndDelete(user._id);
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      user: deletedUser,
      kyc: deletedKyc,
      Support: deletedSupport,
      UserProgress: userProgress,
      attempts,
      Payments: payments,
      Certificates: certificates,
      Feedbacks: feedbacks,
    });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
async function updateRankings(attempt) {
  // Get all evaluated attempts for this user, test, and course
  const attempts = await UserAttempt.find({
    userId: attempt.userId,
    mockTestId: attempt.mockTestId,
    courseId: attempt.courseId,
    status: "evaluated",
    isWithinTestWindow: true,
  });

  // Find best attempt (highest score, earliest submission for ties)
  let bestAttempt = attempts.reduce((best, current) => {
    if (current.totalMarks > best.totalMarks) return current;
    if (
      current.totalMarks === best.totalMarks &&
      current.submittedAt < best.submittedAt
    )
      return current;
    return best;
  }, attempts[0]);

  // Update all attempts to mark which is best
  await UserAttempt.updateMany(
    {
      userId: attempt.userId,
      mockTestId: attempt.mockTestId,
      courseId: attempt.courseId,
    },
    { $set: { isBestAttempt: false } }
  );
  if (bestAttempt) {
    bestAttempt.isBestAttempt = true;
    await bestAttempt.save();

    // Update or create ranking
    const ranking = await UserRanking.findOneAndUpdate(
      {
        userId: attempt.userId,
        mockTestId: attempt.mockTestId,
        subject: attempt.subject,
      },
      {
        bestAttemptId: bestAttempt._id,
        bestScore: bestAttempt.totalMarks,
        attemptsCount: attempts.length,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  // Recalculate all rankings for this test and course
  await recalculateTestRankings(attempt.mockTestId, attempt.subject);
}

async function recalculateTestRankings(mockTestId, subject) {
  const rankings = await UserRanking.find({
    mockTestId,
    subject,
  }).sort({ bestScore: -1, lastUpdated: 1 });

  let currentRank = 1;
  for (let i = 0; i < rankings.length; i++) {
    // Same rank for same scores
    if (i > 0 && rankings[i].bestScore === rankings[i - 1].bestScore) {
      rankings[i].rank = rankings[i - 1].rank;
    } else {
      rankings[i].rank = currentRank;
    }
    currentRank++;

    await rankings[i].save();
  }
}

exports.verifyUserRoles = async (req, res, next) => {
  try {
    const { role, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ success: false, message: "Access denied" });
    } else {
      return res.status(200).json({
        success: true,
        role: user.role,
        message: "Access granted",
        isSuperAdmin: user.isSuperAdmin,
        permissions: user.permissions,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.removeCourseSubscriptionToStudent = async (req, res) => {
  try {
    const { userId, courseIds } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (!user.subscription) {
      user.subscription = []; // Initialize if undefined
    }
    let expiredCourseIds = [];
    expiredCourseIds = user.subscription.map((sub) => {
      if (courseIds.includes(sub.course_enrolled.toString())) {
        return sub.course_enrolled;
      } else {
        return null;
      }
    });
    expiredCourseIds = expiredCourseIds.filter((id) => id !== null);
    let nonExpiredCourseIds = [];
    nonExpiredCourseIds = user.subscription.map((sub) => {
      if (!courseIds.includes(sub.course_enrolled.toString())) {
        return sub.course_enrolled;
      } else {
        return null;
      }
    });
    nonExpiredCourseIds = nonExpiredCourseIds.filter((id) => id !== null);
    const subjectsInExpiredCourses = await Subject.find({
      courses: { $in: expiredCourseIds },
    }).select("_id");
    const subjectsInNonExpiredCourses = await Subject.find({
      courses: { $in: nonExpiredCourseIds },
    }).select("_id");
    let subjectsToDeactivate = [];
    subjectsToDeactivate = subjectsInExpiredCourses.filter(
      (sub) =>
        !subjectsInNonExpiredCourses.some((nsub) => nsub._id.equals(sub._id))
    );
    subjectsToDeactivate = subjectsToDeactivate.map((sub) => sub._id);
    const mockTestsToDeactivate = await MockTest.find({
      subject: { $in: subjectsToDeactivate },
    });

    //remove user attempts for mockTestsToDeactivate
    for (let mt of mockTestsToDeactivate) {
      await UserAttempt.deleteMany({ userId: user._id, mockTestId: mt._id });
      console.log(
        `🗑️ Deleted attempts for user ${user._id} for mock test ${mt._id}`
      );
    }

    //remove user rankings for mockTestsToDeactivate
    for (let mt of mockTestsToDeactivate) {
      await UserRanking.deleteMany({ userId: user._id, mockTestId: mt._id });
      console.log(
        `🗑️ Deleted rankings for user ${user._id} for mock test ${mt._id}`
      );
    }
    const userProgress = await UserProgress.findOne({
      user_id: user._id,
    });
    if (userProgress) {
      userProgress.courseProgress = userProgress.courseProgress.filter(progress => {
        const isExpired = expiredCourseIds
          .map(id => id.toString())
          .includes(progress.course_id.toString());

        return !isExpired;
      });
      console.log("Updated courseProgress", userProgress.courseProgress);
      await userProgress.save();
    }
    for (const courseId of courseIds) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
      if (!course.student_enrolled) course.student_enrolled = [];
      if (course.student_enrolled.includes(user._id)) {
        course.student_enrolled.pull(user._id);
      }
      await course.save();
      const found = user.subscription.find((sub) =>
        sub.course_enrolled.equals(course._id)
      );
      if (found) {
        user.subscription = user.subscription.filter(
          (sub) => !sub.course_enrolled.equals(course._id)
        );
      }
      const certificate = await Certificate.deleteMany({
        user_ref: user._id,
        course_ref: course._id,
      });
    }
    await user.save();
    res.status(200).json({
      success: true,
      message: "Courses added to student successfully",
      user: user,
    });
  } catch (error) {
    console.error("Error adding courses to student:", error.message,error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.phoneOtpGenerate = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    const otp = Math.floor(100000 + Math.random() * 900000);
    const response = await axios.post("https://control.msg91.com/api/v5/otp", {
      otp_expiry: 1,
      template_id: "6835b4f2d6fc053de8172342",
      mobile: `91${user.phone}`,
      authkey: process.env.MSG91_AUTH_KEY,
      otp: otp,
      realTimeResponse: 1,
    });
    if (response.data.type == "success") {
      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: response.data,
      });
    }
    if (response.data.type == "error") {
      return res.status(400).json({
        success: false,
        message: response.data.message,
        data: response.data,
      });
    }
    // await User.updateOne({ email }, { $set: { otp: otp, otpExpiration: new Date(Date.now() + 60000) } });
  } catch (error) {
    console.error("Error generating OTP:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.phoneOtpVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    const response = await axios.get(
      `https://control.msg91.com/api/v5/otp/verify?mobile=91${user.phone}&otp=${otp}`,
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
        },
      }
    );
    if (response.data.type == "success") {
      user.isEmailVerified = true;
      user.otp = undefined;
      user.otpExpiration = undefined;
      const accessToken = jwt.sign(
        { username: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      const refreshToken = jwt.sign(
        { username: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      user.refreshToken = refreshToken;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Phone verified successfully",
        accessToken,
        refreshToken,
        user: user,
        otpData: response.data,
      });
      // return res.status(200).json({ success: true, message: "OTP verified successfully", data: response.data });
    } else if (response.data.type == "error") {
      return res.status(400).json({
        success: false,
        message: response.data.message,
        data: response.data,
      });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.resendPhoneotp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    const otp = Math.floor(100000 + Math.random() * 900000);
    const response = await axios.get(
      `https://control.msg91.com/api/v5/otp/retry?mobile=91${user.phone}&authkey=${process.env.MSG91_AUTH_KEY}`
    );
    if (response.data.type == "success") {
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: response.data,
      });
    } else if (response.data.type == "error") {
      if (response.data.message == "otp_expired") {
        const response = await axios.post(
          "https://control.msg91.com/api/v5/otp",
          {
            otp_expiry: 1,
            template_id: "6835b4f2d6fc053de8172342",
            mobile: `91${user.phone}`,
            authkey: process.env.MSG91_AUTH_KEY,
            otp: otp,
            realTimeResponse: 1,
          }
        );
        if (response.data.type == "success") {
          return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            data: response.data,
          });
        }
        if (response.data.type == "error") {
          return res.status(400).json({
            success: false,
            message: response.data.message,
            data: response.data,
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: response.data.message,
        data: response.data,
      });
    }
  } catch (error) {
    console.error("Error generating OTP:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (userIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No user IDs provided" });
    }
    const results = [];
    for (const id of userIds) {
      try {
        const user = await User.findById(id);
        if (!user) {
          results.push({ id, success: false, message: "User not found" });
          continue;
        }
        // const user = await User.findById(id);
        // if (!user) {
        //   return res.status(404).json({ success: false, message: "User not found" });
        // }
        user.subscription.forEach(async (sub) => {
          const course = await Course.findById(sub.course_enrolled);
          const courseProgress = await CourseProgress.findOne({
            course_id: sub.course_enrolled,
          });
          courseProgress.progress.filter(
            (progress) => !progress.user_id.equals(id)
          );
          await courseProgress.save();
          if (course) {
            course.student_enrolled = course.student_enrolled.filter(
              (studentId) => !studentId.equals(id)
            );
            await course.save();
          }
        });
        const attempts = await UserAttempt.find({ userId: user._id });
        const deletedKyc = await KycDetails.findOneAndDelete({
          userref: user._id,
        });
        const deletedSupport = await Support.find({ userRef: user._id });
        deletedSupport.forEach(async (support) => {
          await Support.findByIdAndDelete(support._id);
        });
        const userProgress = await UserProgress.findOneAndDelete({
          user_id: user._id,
        });
        // const payments = await Payments.find({ userRef: user._id });
        // payments.forEach(async (payment) => {
        //   await Payments.findByIdAndDelete(payment._id);
        // });
        const certificates = await Certificate.find({ user_ref: user._id });
        certificates.forEach(async (certificate) => {
          await Certificate.findByIdAndDelete(certificate._id);
        });
        attempts.forEach(async (attemptID) => {
          const attempt = await UserAttempt.findByIdAndDelete(attemptID._id);
          const userRanking = await UserRanking.findOneAndDelete({
            userId: attempt.userId,
            subject: attempt.subject,
            bestAttemptId: attempt._id,
          });
          const userAttempts = await UserAttempt.find({
            userId: attempt.userId,
            attemptNumber: { $gt: attempt.attemptNumber },
            subject: attempt.subject,
          });
          for (let i = 0; i < userAttempts.length; i++) {
            userAttempts[i].attemptNumber -= 1;
            await userAttempts[i].save();
          }
          const result = await updateRankings(attempt);
        });
        const feedbacks = await Feedback.find({ userRef: user._id });
        feedbacks.forEach(async (feedback) => {
          const course = await Course.findById(feedback.courseRef);
          if (course) {
            course.student_feedback = course.student_feedback.filter(
              (feedbackId) => !feedbackId.equals(feedback._id)
            );
            await course.save();
          }
          await Feedback.findByIdAndDelete(feedback._id);
        });
        const deleteUserRankings = await UserRanking.deleteMany({ userId: user._id });
        const deletedUser = await User.findByIdAndDelete(user._id);
        results.push({
          id,
          success: true,
          message: "User deleted successfully",
          user: deletedUser,
          kyc: deletedKyc,
          Support: deletedSupport.length,
          UserProgress: userProgress,
          attempts: attempts.length,
          Payments: (await Payments.find({ userRef: user._id })).length,
          Certificates: certificates.length,
          Feedbacks: feedbacks.length,
        });
      } catch (error) {
        console.error(`Error deleting user ${id}:`, error.message);
        results.push({ id, success: false, message: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: "Bulk delete operation completed",
      results,
    });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.deleteStudents = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "No user ID provided" });
    }
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // const user = await User.findById(id);
    // if (!user) {
    //   return res.status(404).json({ success: false, message: "User not found" });
    // }
    user.subscription.forEach(async (sub) => {
      const course = await Course.findById(sub.course_enrolled);
      const courseProgress = await CourseProgress.findOne({
        course_id: sub.course_enrolled,
      });
      courseProgress?.progress.filter(
        (progress) => !progress.user_id.equals(userId)
      );
      await courseProgress.save();
      if (course) {
        course.student_enrolled = course.student_enrolled.filter(
          (studentId) => !studentId.equals(userId)
        );
        await course.save();
      }
    });
    const attempts = await UserAttempt.find({ userId: user._id });
    const deletedKyc = await KycDetails.findOneAndDelete({ userref: user._id });
    const deletedSupport = await Support.find({ userRef: user._id });
    deletedSupport.forEach(async (support) => {
      await Support.findByIdAndDelete(support._id);
    });
    const userProgress = await UserProgress.findOneAndDelete({
      user_id: user._id,
    });
    // const payments = await Payments.find({ userRef: user._id });
    // payments.forEach(async (payment) => {
    //   await Payments.findByIdAndDelete(payment._id);
    // });
    const certificates = await Certificate.find({ user_ref: user._id });
    certificates.forEach(async (certificate) => {
      await Certificate.findByIdAndDelete(certificate._id);
    });
    attempts.forEach(async (attemptID) => {
      const attempt = await UserAttempt.findByIdAndDelete(attemptID._id);
      const userRanking = await UserRanking.findOneAndDelete({
        userId: attempt.userId,
        subject: attempt.subject,
        bestAttemptId: attempt._id,
      });
      const userAttempts = await UserAttempt.find({
        userId: attempt.userId,
        attemptNumber: { $gt: attempt.attemptNumber },
        subject: attempt.subject,
      });
      for (let i = 0; i < userAttempts.length; i++) {
        userAttempts[i].attemptNumber -= 1;
        await userAttempts[i].save();
      }
      const result = await updateRankings(attempt);
    });
    const feedbacks = await Feedback.find({ userRef: user._id });
    feedbacks.forEach(async (feedback) => {
      const course = await Course.findById(feedback.courseRef);
      if (course) {
        course.student_feedback = course.student_feedback.filter(
          (feedbackId) => !feedbackId.equals(feedback._id)
        );
        await course.save();
      }
      await Feedback.findByIdAndDelete(feedback._id);
    });
    const deleteUserRankings = await UserRanking.deleteMany({ userId: user._id });
    const deletedUser = await User.findByIdAndDelete(user._id);
    res.status(200).json({
      success: true,
      message: "User deleted successfully",

      user: deletedUser,
      kyc: deletedKyc,
      Support: deletedSupport.length,
      UserProgress: userProgress,
      attempts: attempts.length,
      Payments: (await Payments.find({ userRef: user._id })).length,
      Certificates: certificates.length,
      Feedbacks: feedbacks.length,
      userRankingsDeleted: deleteUserRankings
    });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.checkUserRefreshToken = async (req, res) => {
  try {
    const { userId, refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "No refresh token provided" });
    }
    const user = await User.findOne({ userId, refreshToken });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User found", user });
  } catch (error) {
    console.error("Error checking user:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.blockAndUnblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "No user ID provided" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.isBlocked = !user.isBlocked;
    user.refreshToken = null;
    await user.save();
    res.status(200).json({
      success: true,
      message: user.isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",
      user,
    });
  } catch (error) {
    console.error("Error blocking user:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.enableDisableMasterOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "No user ID provided" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.isMasterOtpEnabled = !user.isMasterOtpEnabled;
    await user.save();
    res.status(200).json({
      success: true,
      message: user.isMasterOtpEnabled
        ? "Master OTP enabled successfully"
        : "Master OTP disabled successfully",
      user,
    });
  } catch (error) {
    console.error("Error blocking user:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.sendChangePasswordOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "No user ID provided" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const response = await axios.post("https://control.msg91.com/api/v5/otp", {
      otp_expiry: 1,
      template_id: "6835b4f2d6fc053de8172342",
      mobile: `91${user.phone}`,
      authkey: process.env.MSG91_AUTH_KEY,
      otp: otp,
      realTimeResponse: 1,
    });
    if (response.data.type == "success") {
      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: response.data,
      });
    }
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.resendChangePasswordOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "No user ID provided" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const response = await axios.get(
      `https://control.msg91.com/api/v5/otp/retry?mobile=91${user.phone}&authkey=${process.env.MSG91_AUTH_KEY}`
    );
    if (response.data.type == "success") {
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: response.data,
      });
    } else if (response.data.type == "error") {
      if (response.data.message == "otp_expired") {
        const response = await axios.post(
          "https://control.msg91.com/api/v5/otp",
          {
            otp_expiry: 1,
            template_id: "6835b4f2d6fc053de8172342",
            mobile: `91${user.phone}`,
            authkey: process.env.MSG91_AUTH_KEY,
            otp: otp,
            realTimeResponse: 1,
          }
        );
        if (response.data.type == "success") {
          res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            data: response.data,
          });
        }
        if (response.data.type == "error") {
          return res.status(400).json({
            success: false,
            message: response.data.message,
            data: response.data,
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: response.data.message,
        data: response.data,
      });
    }
  } catch (error) {
    console.error("Error generating OTP:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.verifyChangePasswordOtp = async (req, res) => {
  try {
    const { userId, Otp } = req.body;
    if (!userId || !Otp) {
      return res
        .status(400)
        .json({ success: false, message: "missing required fields" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const response = await axios.get(
      `https://control.msg91.com/api/v5/otp/verify?mobile=91${user.phone}&otp=${Otp}`,
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
        },
      }
    );
    if (response.data.type == "success") {
      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        data: response.data,
      });
    } else if (response.data.type == "error") {
      if (response.data.message == "Mobile no. already verified") {
        return res.status(400).json({
          success: false,
          message: "OTP already verified Please generate new OTP",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        data: response.data,
      });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, confirmPassword } = req.body;
    if (!userId || !currentPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "missing required fields" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords and Confirm Password do not match",
      });
    }
    const passwordStrengthRegex =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/.test(newPassword);
    console.log(passwordStrengthRegex);
    if (!passwordStrengthRegex) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long, include a number, an uppercase letter, and a special character.",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.verifyChangePassword = async (req, res) => {
  try {
    const { userId, Otp, currentPassword, newPassword, confirmPassword } =
      req.body;
    if (
      !userId ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword ||
      !Otp
    ) {
      return res
        .status(400)
        .json({ success: false, message: "missing required fields" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords and Confirm Password do not match",
      });
    }
    const passwordStrengthRegex =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/.test(newPassword);
    console.log(passwordStrengthRegex);
    if (!passwordStrengthRegex) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long, include a number, an uppercase letter, and a special character.",
      });
    }
    const response = await axios.get(
      `https://control.msg91.com/api/v5/otp/verify?mobile=91${user.phone}&otp=${Otp}`,
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
        },
      }
    );
    if (response.data.type == "success") {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
    } else if (response.data.type == "error") {
      if (response.data.message == "Mobile no. already verified") {
        return res.status(400).json({
          success: false,
          message: "OTP already verified Please generate new OTP",
        });
      }
      return res.status(400).json({
        success: false,
        message: response.data.message,
        data: response.data,
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully", user });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.collectDetailsOnQuestionPaperDownload = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const userAdmins = await User.find({ role: "admin" });


    await sendQuestionPaperDownloadAlert(
      name,
      email,
      phoneNumber,
      "mankavit.clatcoaching11@gmail.com"
    );

    res
      .status(200)
      .json({ success: true, message: "Details collected successfully" });
  } catch (error) {
    console.error("Error collecting details:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getAllStudentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.query;
    let students;
    if (courseId) {
      students = await User.find({
        role: "user",
        "subscription.course_enrolled": courseId,
      })
        .populate("wishList")
        .populate({
          path: "subscription",
          populate: [{ path: "payment_id" }, { path: "course_enrolled" }],
        })
        .populate("kycRef");
    } else {
      students = await User.find({ role: "user" })
        .populate("wishList")
        .populate({
          path: "subscription",
          populate: [{ path: "payment_id" }, { path: "course_enrolled" }],
        })
        .populate("kycRef");
    }

    res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      students,
    });
  } catch (error) {
    console.error("Error fetching students:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.createSubAdmin = async (req, res) => {
  try {
    const {
      email,
      password,
      displayName,
      phone,
      isSuperAdmin = false,
      studentManagement = { access: false, readOnly: false },
      courseManagement = { access: false, readOnly: false },
      paymentManagement = { access: false, readOnly: false },
      webManagement = { access: false, readOnly: false },
      mockTestManagement = { access: false, readOnly: false },
      staticPageManagement = { access: false, readOnly: false },
      meetingManagement = { access: false, readOnly: false }
    } = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const newAdmin = new User({
      email,
      password: hashedPassword,
      displayName,
      phone,
      role: "admin",
      permissions: {
        studentManagement,
        courseManagement,
        paymentManagement,
        webManagement,
        mockTestManagement,
        staticPageManagement,
        meetingManagement
      },
      isSuperAdmin,
      isEmailVerified: true,
      wishList: [],
    });

    await newAdmin.save();
    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: newAdmin,
    });
  } catch (error) {
    console.error("Create Admin Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.updateSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      displayName,
      phone,
      isSuperAdmin,
      studentManagement,
      courseManagement,
      paymentManagement,
      webManagement,
      mockTestManagement,
      staticPageManagement,
      meetingManagement,
    } = req.body;

    // Find the admin by ID
    const user = await User.findById(id);
    if (!user || user.role !== "admin") {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    // Update fields if present
    if (email) user.email = email;
    if (displayName) user.displayName = displayName;
    if (phone) user.phone = phone;
    if (typeof isSuperAdmin === "boolean") user.isSuperAdmin = isSuperAdmin;

    // Password update
    // if (password) {
    //   user.password = await bcrypt.hash(password, 10);
    // }

    // Update permissions if provided
    if (studentManagement)
      user.permissions.studentManagement = studentManagement;
    if (courseManagement) user.permissions.courseManagement = courseManagement;
    if (paymentManagement)
      user.permissions.paymentManagement = paymentManagement;
    if (webManagement) user.permissions.webManagement = webManagement;
    if (mockTestManagement)
      user.permissions.mockTestManagement = mockTestManagement;
    if (staticPageManagement)
      user.permissions.staticPageManagement = staticPageManagement;
    if (meetingManagement)
      user.permissions.meetingManagement = meetingManagement;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      admin: user,
    });
  } catch (error) {
    console.error("Edit Admin Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user || user.role !== "admin") {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.resetAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const user = await User.findById(id);
    if (!user || user.role !== "admin") {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Admin password reset successfully",
    });
  } catch (error) {
    console.error("Reset Admin Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" });
    return res
      .status(200)
      .json({ success: true, message: "Admins fetched successfully", admins });
  } catch (error) {
    console.error("Get Admins Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.forgotPasswordSendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 2);
    user.forgotOtp = otp;
    user.forgotOtpExpiration = otpExpiration;
    await user.save();

    //mail otp on signup

    const mailOptions = {
      from: "mankavit.clatcoaching11@gmail.com",
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP is: ${otp}. It will expire in 2 minutes.`,
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
        message: "OTP sent successfully. Please check your email for the OTP.",
      });
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.resendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.forgotOtpExpiration && user.forgotOtpExpiration > new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "OTP already sent" });
    }

    const otp = generateOTP();
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 2);
    user.forgotOtp = otp;
    user.forgotOtpExpiration = otpExpiration;
    await user.save();
    //mail otp on signup

    const mailOptions = {
      from: "mankavit.clatcoaching11@gmail.com",
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP is: ${otp}. It will expire in 2 minutes.`,
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
        message: "OTP sent successfully. Please check your email for the OTP.",
      });
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (!user.forgotOtpExpiration || user.forgotOtpExpiration < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }
    if (user.forgotOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    user.forgotOtpVerified = true;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords and Confirm Password do not match",
      });
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
    if (user.forgotOtpVerified !== true) {
      return res
        .status(400)
        .json({ success: false, message: "OTP not verified" });
    }
    user.password = await bcrypt.hash(password, 10);
    user.forgotOtpVerified = false;
    user.forgotOtp = null;
    user.forgotOtpExpiration = null;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.sendPaperDownloadMail = async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    const admins = await User.find({ role: "admin" });


    await sendAdminPaperDownloadMail(name, email, phone, "mankavit.clatcoaching11@gmail.com");

    return res
      .status(200)
      .json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error sending email" });
  }
};


exports.bulkDeleteSubAdmins = async (req, res) => {
  try {
    const { adminIds } = req.body;
    const results = [];
    for (const id of adminIds) {
      try {
        const user = await User.findById(id);
        if (!user || user.role !== "admin") {
          results.push({ id, success: false, message: "Admin not found" });
          continue;
        }

        await User.findByIdAndDelete(id);

        results.push({ id, success: true, message: "Admin deleted successfully" });
      } catch (error) {
        console.error(`Error deleting admin ${id}:`, error.message);
        results.push({ id, success: false, message: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
      results,
    });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMeetingHosts = async (req, res) => {
  try {
    const hosts = await User.find({ role: "admin", 'permissions.meetingManagement.access': true })
    return res.status(200).json({ success: true, hosts });
  } catch (error) {
    console.error("Get Meeting Hosts Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.updateFcmToken = async (req, res) => {
  const { fcmToken, userId, device, platform } = req.body;

  // Validate input
  if (!fcmToken) {
    return res.status(400).json({ success: false, message: "FCM token is required" });
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Valid userId is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn("FCM Update: User not found", userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Log for debugging
    console.log("Updating FCM token for user:", user.email);
    console.log("New FCM token:", fcmToken.substring(0, 20) + "...");

    // This is the critical call
    await saveFcmTokenIfPresent(user, fcmToken, device, platform);

    // Confirm it was saved
    const updatedUser = await User.findById(userId, "fcmTokens");
    console.log("FCM tokens after update:", updatedUser.fcmTokens.map(t => t.token));

    return res.status(200).json({
      success: true,
      message: "FCM token updated",
    });
  } catch (error) {
    console.error("FCM Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update FCM token",
    });
  }
};