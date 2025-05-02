const Course = require("../model/course_model");

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const courseData = req.body;

    // Validate category if provided
    if (courseData.categories) {
      const validCategories = ["All", "Popular", "Newest", "Advance"];
      if (!validCategories.includes(courseData.categories)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid category. Must be one of: All, Popular, Newest, Advance",
        });
      }
    }

    // Check if course with this name already exists
    const existingCourse = await Course.findOne({
      courseName: courseData.courseName,
    });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: "Course with this name already exists.",
      });
    }

    const newCourse = new Course({
      ...courseData,
      categories: courseData.categories || "All", // Default to "All" if not provided
    });

    const savedCourse = await newCourse.save();

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: savedCourse,
    });
  } catch (error) {
    console.error("Error creating course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create course.",
      error: error.message,
    });
  }
};

// Search courses by name and filter by category
exports.searchCourses = async (req, res) => {
  try {
    const { name, category } = req.query;
    let query = {};

    // Add name filter if provided (case-insensitive search)
    if (name) {
      query.courseName = { $regex: name, $options: "i" };
    }

    // Add category filter if provided
    if (category) {
      const validCategories = ["All", "Popular", "Newest", "Advance"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid category. Must be one of: All, Popular, Newest, Advance",
        });
      }
      query.categories = category;
    }

    const courses = await Course.find(query)
      .populate("subjects", "subjectName")
      .sort({ courseName: 1 }); // Sort alphabetically by course name

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Error searching courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not search courses.",
      error: error.message,
    });
  }
};

// Get all courses - updated to filter by category if provided
exports.getAllCourses = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    if (category) {
      query.categories = category;
    }

    const courses = await Course.find(query).populate(
      "subjects",
      "subjectName"
    );

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch courses.",
      error: error.message,
    });
  }
};

// Get courses by category
exports.getCoursesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const validCategories = ["All", "Popular", "Newest", "Advance"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid category. Must be one of: All, Popular, Newest, Advance",
      });
    }

    const courses = await Course.find({ categories: category }).populate(
      "subjects",
      "subjectName"
    );

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses by category:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch courses by category.",
      error: error.message,
    });
  }
};

// Update course by ID - with category validation
exports.updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const updateData = req.body;

    // Validate category if provided in update
    if (updateData.categories) {
      const validCategories = ["All", "Popular", "Newest", "Advance"];
      if (!validCategories.includes(updateData.categories)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid category. Must be one of: All, Popular, Newest, Advance",
        });
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update course.",
      error: error.message,
    });
  }
};

exports.publishCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { isPublished: true },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course published successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error publishing course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not publish course.",
      error: error.message,
    });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId).populate(
      "subjects",
      "subjectName"
    );
    //   .populate("mockTests", "testName");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Error fetching course by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch course.",
      error: error.message,
    });
  }
};

// Update course by ID
exports.updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const updateData = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update course.",
      error: error.message,
    });
  }
};

// Delete course by ID
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: deletedCourse,
    });
  } catch (error) {
    console.error("Error deleting course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete course.",
      error: error.message,
    });
  }
};
