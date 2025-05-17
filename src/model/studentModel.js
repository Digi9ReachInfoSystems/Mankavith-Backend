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
      subscribe_status: {
        type: String,
        default: false,
        enum: ["active", "inactive", "pending"],
        default: "active",
      },
      payment_status: {
        type: String,
        enum: ["paid", "failed", "pending"],
        default: "active",
      },
      payment_id: {
        type: String,
        default: null,
      },
      kyc_status: {
        type: String,
        enum: ["pending", "approved", "rejected", "not-applied"],
        default: "pending",
      },
    },
  ],

  kycRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "KycDetails",
  },
  kyc_status: {
    type: String,
    enum: ["pending", "approved", "rejected", "not-applied"],
    default: "pending",
  },

  // image: { type: String, required: true },
});

studentSchema.pre("save", function (next) {
  this.isEnrolled = this.courseRef?.some(
    (course) => course.subscribe_status === "active"
  );
  next();
});

module.exports = mongoose.model("Student", studentSchema);
