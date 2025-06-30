const Feedback = require("../model/feedback");
const Course = require("../model/course_model");

// Create new feedback
exports.createFeedback = async (req, res) => {
  try {
    const { name, rating, review, image, userRef, courseRef, email, message, title } =
      req.body;

    // Basic validation
    if (!rating || !review || !userRef || !courseRef || !title) {
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
    const feedbackExists = await Feedback.findOne({
      userRef,
      courseRef,
    });
    if (feedbackExists) {
      feedbackExists
      feedbackExists.rating = rating;
      feedbackExists.review = review;
      feedbackExists.title = title;
      feedbackExists.isappproved = false;
      await feedbackExists.save();
      const course = await Course.findById(courseRef);
      if (!course.student_feedback) {
        course.student_feedback = [];
      }
      course.student_feedback.pop(feedbackExists._id);
    } else {
      const newFeedback = new Feedback({
        name,
        rating,
        review,
        image,
        userRef,
        title,
        courseRef,
      });
    }




    const savedFeedback = await newFeedback.save();
    // const course = await Course.findById(courseRef);
    // if (!course.student_feedback) {
    //   course.student_feedback = [];
    // }
    // course.student_feedback.push(savedFeedback._id);
    // await course.save();

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
    if (isApproved !== undefined) query.isappproved = isApproved === "true" || false;

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
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }
    // Remove feedback from associated course's student_feedback array
    if (feedback.isappproved) {
      const course = await Course.findById(feedback.courseRef);
      if (course) {
        course.student_feedback.pull(feedbackId);
        await course.save();
      }
    }

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
    const course = await Course.findById(updatedFeedback.courseRef);
    if (!course.student_feedback) {
      course.student_feedback = [];
    }
    course.student_feedback.push(updatedFeedback._id);
    await course.save();

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

exports.bulkDeleteFeedback = async (req, res) => {
  try {
    const { feedbackIds } = req.body;
    if (feedbackIds.length === 0) {
      return res.status(400).json({ success: false, message: "No feedback IDs provided" });
    }

    let results = [];
    for (const feedbackId of feedbackIds) {
      try {

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
          results.push({
            id: feedbackId,
            success: false,
            message: "Feedback not found",
          });
          continue; // Skip to the next ID if feedback not found
        }
        // Remove feedback from associated course's student_feedback array
        if (feedback.isappproved) {
          const course = await Course.findById(feedback.courseRef);
          if (course) {
            course.student_feedback.pull(feedbackId);
            await course.save();
          }
        }

        const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);

        if (!deletedFeedback) {
          results.push({
            id: feedbackId,
            success: false,
            message: "Feedback not found",
          });
          continue; // Skip to the next ID if feedback not found
        }

        results.push({
          id: feedbackId,
          success: true,
          message: "Feedback deleted successfully",
          data: deletedFeedback,
        });

      } catch (error) {
        console.error("Error deleting feedback:", error.message);
        results.push({
          id: feedbackId,
          success: false,
          message: "Error deleting feedback",
          error: error.message,
        });
      }
    }
    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
      data: results,
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

