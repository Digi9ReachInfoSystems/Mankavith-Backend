const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isEnrolled: {
    type: Boolean,
    default: false,
  },
  courseRef: [
    {
      courseRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      kycRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "KycDetails",
      },
      kyc_status: {
        type: Boolean,
        default: false
      },
      subscribe_status: {
        type: string,
        default: false,
        enum: ["active", "inactive", "pending"],
        default: "active",
      },
      payment_status: {
        type: string,
        enum: ["paid", "failed", "pending"],
        default: "active",
      },
      payment_id: {
        type: string,
        default: "",
      },
    },
  ],
  wishList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  id_proof: {
    type: String,
    required: true
  },

  // image: { type: String, required: true },
});

studentSchema.pre("save", function (next) {
  this.isEnrolled = this.courseRef?.some(course => course.subscribe_status === "active");
  next();
});

module.exports = mongoose.model("Student", studentSchema);
