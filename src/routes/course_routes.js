const express = require("express");
const router = express.Router();
const courseController = require("../controller/course_controller");

// Course Routes

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

module.exports = router;
