const Certificate = require("../model/certificatesModel");

// Create a new certificate
exports.createCertificate = async (req, res) => {
  try {
    const { certificate_url, course_ref, user_ref } = req.body;

    // Validate required fields
    if (!certificate_url || !course_ref || !user_ref) {
      return res.status(400).json({
        success: false,
        message:
          "certificate_url, course_ref, and user_ref are required fields",
      });
    }

    // Check if certificate already exists for this user and course
    const existingCertificate = await Certificate.findOne({
      course_ref,
      user_ref,
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: "Certificate already exists for this user and course",
      });
    }

    const newCertificate = new Certificate({
      certificate_url,
      course_ref,
      user_ref,
    });

    const savedCertificate = await newCertificate.save();

    return res.status(201).json({
      success: true,
      message: "Certificate created successfully",
      data: savedCertificate,
    });
  } catch (error) {
    console.error("Error creating certificate:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create certificate.",
      error: error.message,
    });
  }
};

// Get all certificates
exports.getAllCertificates = async (req, res) => {
  try {
    const { user_id, course_id } = req.query;
    let query = {};

    if (user_id) query.user_ref = user_id;
    if (course_id) query.course_ref = course_id;

    const certificates = await Certificate.find(query)
      .populate("course_ref", "courseName")
      .populate("user_ref", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    console.error("Error fetching certificates:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch certificates.",
      error: error.message,
    });
  }
};

// Get certificate by ID
exports.getCertificateById = async (req, res) => {
  try {
    const certificateId = req.params.id;

    const certificate = await Certificate.findById(certificateId)
      .populate("course_ref", "courseName")
      .populate("user_ref", "name email");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error("Error fetching certificate by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch certificate.",
      error: error.message,
    });
  }
};

// Update certificate
exports.updateCertificate = async (req, res) => {
  try {
    const certificateId = req.params.id;
    const { certificate_url } = req.body;

    if (!certificate_url) {
      return res.status(400).json({
        success: false,
        message: "certificate_url is required",
      });
    }

    const updatedCertificate = await Certificate.findByIdAndUpdate(
      certificateId,
      { certificate_url },
      { new: true, runValidators: true }
    )
      .populate("course_ref", "courseName")
      .populate("user_ref", "name email");

    if (!updatedCertificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Certificate updated successfully",
      data: updatedCertificate,
    });
  } catch (error) {
    console.error("Error updating certificate:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update certificate.",
      error: error.message,
    });
  }
};

// Delete certificate
exports.deleteCertificate = async (req, res) => {
  try {
    const certificateId = req.params.id;

    const deletedCertificate = await Certificate.findByIdAndDelete(
      certificateId
    );

    if (!deletedCertificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Certificate deleted successfully",
      data: deletedCertificate,
    });
  } catch (error) {
    console.error("Error deleting certificate:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete certificate.",
      error: error.message,
    });
  }
};

// Get certificates by user ID
exports.getCertificatesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const certificates = await Certificate.find({ user_ref: userId })
      .populate("course_ref", )
      .populate("user_ref", )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    console.error("Error fetching user certificates:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch user certificates.",
      error: error.message,
    });
  }
};

// Get certificates by course ID
exports.getCertificatesByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const certificates = await Certificate.find({ course_ref: courseId })
      .populate("course_ref", )
      .populate("user_ref",)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    console.error("Error fetching course certificates:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch course certificates.",
      error: error.message,
    });
  }
};
