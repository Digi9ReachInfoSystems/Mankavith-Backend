const e = require("express");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    phone: { type: String, required: false },
    displayName: { type: String, required: false },
    photo_url: {
        type: String,
        required: false,
        validate: {
            validator: function (v) {
                // Regex to validate image URL
                return /^(ftp|http|https):\/\/[^ "]+$/.test(v);
            },
            message: "Invalid image URL format",
        }
    }, // URL for photo
    role: {
        type: String,
        enum: ["user", "admin"],
    },
    email: {
        type: String, required: true,
        validate: {

            validator: function (email) {
                // Regular expression for email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            },
            message: "Invalid email format",

        }
    },
    password: { type: String, required: true },
    otp: { type: String }, 
    otpExpiration: { type: Date }, 
    isEmailVerified: { type: Boolean, default: false }, 
    refreshToken: { type: String },
    loginOtp: { type: String },
    loginOtpExpiration: { type: Date },
});

// Create and export the User model
module.exports = mongoose.model("User", userSchema);
