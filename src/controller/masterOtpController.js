const MasterOTP = require("../model/masterOTPModel");

exports.updateMasterOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const updatedOTP = await MasterOTP.findOneAndUpdate({}, { otp }, { upsert: true, new: true, runValidators: true }); 
        res.status(200).json({ success: true, message: "OTP updated successfully", otp: updatedOTP.otp });
    } catch (error) {
        console.error("Error updating OTP:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

exports.getMasterOTP = async (req, res) => {
    try {
        const otp = await MasterOTP.findOne({}).exec();
        res.status(200).json({ success: true, message: "OTP fetched successfully", otp: otp.otp });
    } catch (error) {
        console.error("Error fetching OTP:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};