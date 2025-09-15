const mongoose = require("mongoose");

const KycSchema = new mongoose.Schema({
  // first_name: {
  //   type: String,
  //   required: false,
  // },
  // last_name: {
  //   type: String,
  //   required: false,
  // },
  // age: {
  //   type: Number,
  //   required: false,
  // },
  // email: {
  //   type: String,
  //   required: false,kycmode
  // },
  // mobile_number: {
  //   type: String,
  //   required: true,
  // },




  id_proof: {
    type: String,
    required: false,
  },
  passport_photo: {
    type: String,
    required: false,
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
  date_of_birth: { type: Date },
   fathers_name: { type: String },
  fathers_occupation: { type: String },
    present_address: { type: String },
///for currnet occupation there will be 2 option llb or others if a user clkicks other sther will be text box to enter the occupoation

    current_occupation: { type: String },
    how_did_you_get_to_know_us: { type: String },
    terms : { type: Boolean, required: false, default: true},

},
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

KycSchema.virtual("age").get(function () {
  if (!this.date_of_birth) return undefined;
  const dob = new Date(this.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
});

module.exports = mongoose.model("Kyc", KycSchema);
