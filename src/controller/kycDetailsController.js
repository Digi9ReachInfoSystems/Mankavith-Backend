const { sendStudentKYCAcknowledgment, sendAdminKYCNofification, sendKYCApprovalEmail, sendKYCRejectionEmail } = require("../middleware/mailService");
const Kyc = require("../model/kycDetails");
const User = require("../model/user_model");

// Create KYC record
// exports.createKyc = async (req, res) => {
//   try {
//     const {
//       // first_name,
//       // last_name,
//       // age,
//       // email,
//       // mobile_number,
//       id_proof,
//       passport_photo,
//       userref,
//       date_of_birth,
//       fathers_name,
//       fathers_occupation,
//       present_address,
//       current_occupation,
//       how_did_you_get_to_know_us



//     } = req.body;
//     console.log("req.body", req.body);
//     // Validate required fields
//     if (
//       // !first_name ||
//       // !last_name ||
//       // !age ||
//       // !email ||
//       // !mobile_number ||
//       !id_proof ||
//       !passport_photo ||
//       !userref ||
//        !date_of_birth ||
//       !fathers_name ||
//       !fathers_occupation ||
//       !present_address ||
//      !current_occupation ||
//       !how_did_you_get_to_know_us


//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     // Check if KYC already exists for this user
//     const existingKyc = await Kyc.findOne({ userref });
//     if (existingKyc) {
//       // existingKyc.first_name = first_name;
//       // existingKyc.last_name = last_name;
//       // existingKyc.age = age;
//       // existingKyc.email = email;
//       // existingKyc.mobile_number = mobile_number;
//       existingKyc.id_proof = id_proof;
//       existingKyc.passport_photo = passport_photo;
//       existingKyc.date_of_birth = date_of_birth;
//       existingKyc.fathers_name = fathers_name;
//       existingKyc.fathers_occupation = fathers_occupation;
//       existingKyc.present_address = present_address;
//       existingKyc.current_occupation = current_occupation;
//       existingKyc.how_did_you_get_to_know_us = how_did_you_get_to_know_us;
//       const updatedKyc = await existingKyc.save();
//       const user = await User.findById(userref);
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: "User not found",
//         });
//       }
//       user.kycRef = existingKyc._id;
//       user.kyc_status = "pending"; // Set initial KYC status
//       await user.save();
//       return res.status(200).json({
//         success: true,
//         message: "KYC record updated successfully",
//         data: updatedKyc,
//         user: user,
//       });
//     }

//     // Validate age
//     if (age < 18) {
//       return res.status(400).json({
//         success: false,
//         message: "User must be at least 18 years old",
//       });
//     }

//     const newKyc = new Kyc({
//       // first_name,
//       // last_name,
//       // age,
//       // email,
//       // mobile_number,
//       id_proof,
//       passport_photo,
//       userref,
//       date_of_birth,
//       fathers_name,
//       fathers_occupation,
//       present_address,
//       current_occupation,
//       how_did_you_get_to_know_us,
//       status: "pending",
//     });

//     const savedKyc = await newKyc.save();
//     const user = await User.findById(userref);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }
//     user.kycRef = savedKyc._id;
//     user.kyc_status = "pending"; // Set initial KYC status
//     await user.save();
//     await sendStudentKYCAcknowledgment(user.displayName, user.email);
//     const  userAdmin = await User.find({role:"admin"});
//     await Promise.all(
//       userAdmin.map(async (admin) => {
//         await sendAdminKYCNofification(user.displayName, user.email, admin.email);
//       })
//     )
//     return res.status(201).json({
//       success: true,
//       message: "KYC record created successfully",
//       data: savedKyc,
//     });
//   } catch (error) {
//     console.error("Error creating KYC:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Server error. Could not create KYC record.",
//       error: error.message,
//     });
//   }
// };


// helper: compute age in full years from a Date
function getAgeFromDOB(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

exports.createKyc = async (req, res) => {
  try {
    const {
      id_proof,
      passport_photo,
      userref,
      date_of_birth,
      fathers_name,
      fathers_occupation,
      present_address,
      current_occupation,
      how_did_you_get_to_know_us
    } = req.body;

    // Basic presence validation
    if (
      !id_proof ||
      !passport_photo ||
      !userref ||
      !date_of_birth ||
      !fathers_name ||
      !fathers_occupation ||
      !present_address ||
      !current_occupation ||
      !how_did_you_get_to_know_us
    ) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Validate and parse DOB, then compute age
    const dob = new Date(date_of_birth); // expect ISO string like "2002-05-14"
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date_of_birth" });
    }
    const derivedAge = getAgeFromDOB(dob);

    // Age gate (if required)
    if (derivedAge < 18) {
      return res.status(400).json({
        success: false,
        message: "User must be at least 18 years old"
      });
    }

    // Check if KYC already exists for this user
    const existingKyc = await Kyc.findOne({ userref });
    if (existingKyc) {
      existingKyc.id_proof = id_proof;
      existingKyc.passport_photo = passport_photo;
      existingKyc.date_of_birth = dob; // store as Date
      existingKyc.fathers_name = fathers_name;
      existingKyc.fathers_occupation = fathers_occupation;
      existingKyc.present_address = present_address;
      existingKyc.current_occupation = current_occupation;
      existingKyc.how_did_you_get_to_know_us = how_did_you_get_to_know_us;
      // optionally: reset status on re-submit
      existingKyc.status = "pending";

      const updatedKyc = await existingKyc.save();

      const user = await User.findById(userref);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      user.kycRef = existingKyc._id;
      user.kyc_status = "pending";
      await user.save();

      return res.status(200).json({
        success: true,
        message: "KYC record updated successfully",
        data: updatedKyc,
        user
      });
    }

    // Create new KYC
    const newKyc = new Kyc({
      id_proof,
      passport_photo,
      userref,
      date_of_birth: dob,
      fathers_name,
      fathers_occupation,
      present_address,
      current_occupation,
      how_did_you_get_to_know_us,
      status: "pending"
    });

    const savedKyc = await newKyc.save();

    const user = await User.findById(userref);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.kycRef = savedKyc._id;
    user.kyc_status = "pending";
    await user.save();

    await sendStudentKYCAcknowledgment(user.displayName, user.email);
    const userAdmin = await User.find({ role: "admin" });
    await Promise.all(
      userAdmin.map((admin) =>
        sendAdminKYCNofification(user.displayName, user.email, admin.email)
      )
    );

    return res.status(201).json({
      success: true,
      message: "KYC record created successfully",
      data: savedKyc
    });
  } catch (error) {
    console.error("Error creating KYC:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create KYC record.",
      error: error.message
    });
  }
};



// Get all KYC records with optional status filter
exports.getAllKyc = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    const kycs = await Kyc.find(query)
      .populate("userref", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: kycs.length,
      data: kycs,
    });
  } catch (error) {
    console.error("Error fetching KYC records:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch KYC records.",
      error: error.message,
    });
  }
};

// Get KYC by ID
exports.getKycById = async (req, res) => {
  try {
    const kycId = req.params.id;

    const kyc = await Kyc.findById(kycId).populate("userref", "name email");

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: kyc,
    });
  } catch (error) {
    console.error("Error fetching KYC by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch KYC record.",
      error: error.message,
    });
  }
};

// Update KYC status
exports.updateKycStatus = async (req, res) => {
  try {
    const kycId = req.params.id;
    const { status } = req.body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (pending, approved, rejected)",
      });
    }

    const updatedKyc = await Kyc.findByIdAndUpdate(
      kycId,
      { status },
      { new: true, runValidators: true }
    ).populate("userref", "name email");
    const user = await User.findById(updatedKyc.userref._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    user.kyc_status = status;
    await user.save();
    if (status === "approved") {
      await sendKYCApprovalEmail(user.displayName, user.email);
     
    }else if (status === "rejected") {
      await sendKYCRejectionEmail(user.displayName, user.email);
    }
    if (!updatedKyc) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "KYC status updated successfully",
      data: updatedKyc,
    });
  } catch (error) {
    console.error("Error updating KYC status:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update KYC status.",
      error: error.message,
    });
  }
};

// Delete KYC record
exports.deleteKyc = async (req, res) => {
  try {
    const kycId = req.params.id;

    const deletedKyc = await Kyc.findByIdAndDelete(kycId);

    if (!deletedKyc) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "KYC record deleted successfully",
      data: deletedKyc,
    });
  } catch (error) {
    console.error("Error deleting KYC record:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete KYC record.",
      error: error.message,
    });
  }
};

// Get KYC by user reference
exports.getKycByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const kyc = await Kyc.findOne({ userref: userId }).populate(
      "userref",
      "name email"
    );

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "No KYC record found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      data: kyc,
    });
  } catch (error) {
    console.error("Error fetching KYC by user:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch KYC record.",
      error: error.message,
    });
  }
};
exports.updateKyc = async (req, res) => {
  try {
    const kycId = req.params.id;
    const {
      first_name,
      last_name,
      age,
      email,
      mobile_number,
      id_proof,
      passport_photo,
    } = req.body;

    // Validate required fields
    const kyc = await Kyc.findById(kycId);
    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found",
      });
    }
    kyc.first_name = first_name || kyc.first_name;
    kyc.last_name = last_name || kyc.last_name;
    kyc.age = age || kyc.age;
    kyc.email = email || kyc.email;
    kyc.mobile_number = mobile_number || kyc.mobile_number;
    kyc.id_proof = id_proof || kyc.id_proof;
    kyc.passport_photo = passport_photo || kyc.passport_photo;


    const updatedKyc = await kyc.save();


    if (!updatedKyc) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "KYC record updated successfully",
      data: updatedKyc,
    });
  } catch (error) {
    console.error("Error updating KYC:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update KYC record.",
      error: error.message,
    });
  }
}
