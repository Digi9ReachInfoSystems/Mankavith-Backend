const mongoose = require("mongoose");

const KycSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile_number: {
    type: String,
    required: true,
  },
  id_proof: {
    type: String,
    required: true,
  },
  passport_photo: {
    type: String,
    required: true,
  },
  userref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "not-applied"],
    default: "pending",
  },
});

module.exports = mongoose.model("Kyc", KycSchema);
