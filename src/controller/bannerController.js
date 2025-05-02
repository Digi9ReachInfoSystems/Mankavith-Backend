const Banner = require("../model/bannerModel");
const Course = require("../model/course_model");

// Create a new banner
exports.createBanner = async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      course_ref,
      course_title,
      course_rating,
    } = req.body;

    // Validate required fields
    if (!title || !description || !image) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate course exists
    const course = await Course.findById(course_ref);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Validate rating range
    if (course_rating < 0 || course_rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Course rating must be between 0 and 5",
      });
    }

    const newBanner = new Banner({
      title,
      description,
      image,
      course_ref,
      course_title,
      course_rating,
    });

    const savedBanner = await newBanner.save();

    return res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: savedBanner,
    });
  } catch (error) {
    console.error("Error creating banner:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create banner.",
      error: error.message,
    });
  }
};

// Get all banners
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .populate("course_ref", "courseName duration price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch banners.",
      error: error.message,
    });
  }
};

// Get banner by ID
exports.getBannerById = async (req, res) => {
  try {
    const bannerId = req.params.id;

    const banner = await Banner.findById(bannerId).populate(
      "course_ref",
      "courseName duration price"
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error("Error fetching banner by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch banner.",
      error: error.message,
    });
  }
};

// Update banner
exports.updateBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;
    const { title, description, image, course_rating } = req.body;

    // Validate at least one field is provided
    if (!title && !description && !image && course_rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "At least one field to update is required",
      });
    }

    // Validate rating if provided
    if (
      course_rating !== undefined &&
      (course_rating < 0 || course_rating > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: "Course rating must be between 0 and 5",
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (image) updateData.image = image;
    if (course_rating !== undefined) updateData.course_rating = course_rating;

    const updatedBanner = await Banner.findByIdAndUpdate(bannerId, updateData, {
      new: true,
      runValidators: true,
    }).populate("course_ref", "courseName duration price");

    if (!updatedBanner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: updatedBanner,
    });
  } catch (error) {
    console.error("Error updating banner:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update banner.",
      error: error.message,
    });
  }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;

    const deletedBanner = await Banner.findByIdAndDelete(bannerId);

    if (!deletedBanner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
      data: deletedBanner,
    });
  } catch (error) {
    console.error("Error deleting banner:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete banner.",
      error: error.message,
    });
  }
};

// Get banners by course
exports.getBannersByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const banners = await Banner.find({ course_ref: courseId })
      .populate("course_ref", "courseName duration price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners by course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch banners.",
      error: error.message,
    });
  }
};
