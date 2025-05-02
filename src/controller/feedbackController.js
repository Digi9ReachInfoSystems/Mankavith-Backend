const Feedback = require("../model/feedback");

// Create new feedback
exports.createFeedback = async (req, res) => {
  try {
    const { name, rating, review, image, userRef, courseRef, email, message } =
      req.body;

    // Basic validation
    if (!name || !rating || !review || !image || !userRef || !courseRef) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const newFeedback = new Feedback({
      name,
      rating,
      review,
      image,
      userRef,
      courseRef,
    });

    const savedFeedback = await newFeedback.save();

    return res.status(201).json({
      success: true,
      message: "Feedback created successfully",
      data: savedFeedback,
    });
  } catch (error) {
    console.error("Error creating feedback:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create feedback.",
      error: error.message,
    });
  }
};

// Get all feedback (with optional filters)
exports.getFeedback = async (req, res) => {
  try {
    const { courseId, userId, isApproved } = req.query;
    let query = {};

    if (courseId) query.courseRef = courseId;
    if (userId) query.userRef = userId;
    if (isApproved !== undefined) query.isappproved = isApproved === "true";

    const feedbacks = await Feedback.find(query)
      .populate("userRef", "name email")
      .populate("courseRef", "courseName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch feedback.",
      error: error.message,
    });
  }
};

// Get single feedback by ID
exports.getFeedBackById = async (req, res) => {
  try {
    const feedbackId = req.params.id;

    const feedback = await Feedback.findById(feedbackId)
      .populate("userRef", "name email")
      .populate("courseRef", "courseName");

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error("Error fetching feedback by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch feedback.",
      error: error.message,
    });
  }
};

// Update feedback
exports.updateFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const updateData = req.body;

    // Validate rating if provided
    if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("userRef", "name email")
      .populate("courseRef", "courseName");

    if (!updatedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback updated successfully",
      data: updatedFeedback,
    });
  } catch (error) {
    console.error("Error updating feedback:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update feedback.",
      error: error.message,
    });
  }
};

// Delete feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;

    const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!deletedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
      data: deletedFeedback,
    });
  } catch (error) {
    console.error("Error deleting feedback:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete feedback.",
      error: error.message,
    });
  }
};

// Approve feedback (special endpoint for approval)
exports.approveFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { isappproved: true },
      { new: true }
    )
      .populate("userRef", "name email")
      .populate("courseRef", "courseName");

    if (!updatedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback approved successfully",
      data: updatedFeedback,
    });
  } catch (error) {
    console.error("Error approving feedback:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not approve feedback.",
      error: error.message,
    });
  }
};
