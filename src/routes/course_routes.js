const express = require("express");
const router = express.Router();
const courseController = require("../controller/course_controller");

// Course Routes

router.get("/total", courseController.getNoOfCourses);
// Create a new course

router.post("/", courseController.createCourse);

// Get all courses (with optional category filter via query parameter)
router.get("/", courseController.getAllCourses);

// Get courses by specific category (via route parameter)
router.get("/category/:categoryName", courseController.getCoursesByCategory);

// Add this to your course_routes.js file
router.get("/search", courseController.searchCourses);

// Get a single course by ID
router.get("/:id", courseController.getCourseById);

// Update a course by ID
router.put("/:id", courseController.updateCourse);

// Publish a course
router.patch("/:id/publish", courseController.publishCourse);

// Delete a course by ID
router.delete("/:id", courseController.deleteCourse);
router.get("/search/CourseandCategory", courseController.searchCourses);
router.post("/addFeedback/:courseId", courseController.addFeedbackToCourse);
router.get("/getAllCourses/users/:user_id", courseController.getAllUserCourses);
router.get("/getAllCourses/users/category/:user_id/:category", courseController.getAllUserCoursesByCategory);
router.get("/search/CourseandCategory/:user_id/:categoryName", courseController.searchUserCourses);

module.exports = router;
