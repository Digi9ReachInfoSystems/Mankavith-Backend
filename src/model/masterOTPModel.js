const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    otp: { type: String, required: true ,default: "000000"},
    
});

module.exports = mongoose.model("MasterOTP", otpSchema);