const e = require("express");
const { sign } = require("jsonwebtoken");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  phone: { type: String, required: false },
  displayName: { type: String, required: false, default: "User" },
  fathers_name: { type: String },
  fathers_occupation: { type: String },
  current_occupation: { type: String },
  present_address: { type: String },
  passing_year: { type: String },
  college_name: { type: String },
  date_of_birth: { type: Date },

  subscription: [
    {
      payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
      payment_Status: {
        type: String,
        // enum: ["pending", "success", "failed", "refunded"],
        // default: "pending",
      },
      course_enrolled: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      is_subscription_active: {
        type: Boolean,
        default: false,
      },
      created_at: {
        type: Date,
        default: Date.now,
      }, 
      expires_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  photo_url: {
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        // Regex to validate image URL
        return /^(ftp|http|https):\/\/[^ "]+$/.test(v);
      },
      message: "Invalid image URL format",
    },
    default: "https://mankavit.blob.core.windows.net/profile/60111.jpg",
  }, // URL for photo
  role: {
    type: String,
    enum: ["user", "admin"],
  },
  email: {
    type: String,
    required: true,
    validate: {
      validator: function (email) {
        // Regular expression for email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: "Invalid email format",
    },
  },
  wishList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  password: { type: String, required: true },
  otp: { type: String },
  otpExpiration: { type: Date },
  isEmailVerified: { type: Boolean, default: false },
  refreshToken: { type: String },
  loginOtp: { type: String },
  loginOtpExpiration: { type: Date },
  forgotOtp: { type: String },
  forgotOtpExpiration: { type: Date },
  forgotOtpVerified: { type: Boolean, default: false },
  kycRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Kyc",
    default: null,
  },
  kyc_status: {
    type: String,
    enum: ["pending", "approved", "rejected", "not-applied"],
    default: "not-applied",
  },
  deviceId: {
    type: String,
    default: null,
  },
  signedUpAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  lastActive: { type: Date },
  device: {
    deviceId: { type: String, required: false },
    deviceType: {
      type: String,
      enum: ["web", "android", "ios"],
      required: false,
    },
    browser_name: { type: String },

    userAgent: String,
    ipAddress: String,
    lastLogin: { type: Date, default: Date.now },
    refreshTokenExpiry: { type: Date, default: Date.now },
    isCurrent: { type: Boolean, default: false },
  },
  isBlocked: { type: Boolean, default: false },
  masterOtp: { type: String, default: "000000" },
  isMasterOtpEnabled: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
  permissions: {
    studentManagement: {
      access: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
    },
    courseManagement: {
      access: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
    },
    paymentManagement: {
      access: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
    },
    webManagement: {
      access: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
    },
    mockTestManagement: {
      access: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
    },
    staticPageManagement: {
      access: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
    }, 
  },
});

// Create and export the User model
module.exports = mongoose.model("User", userSchema);
