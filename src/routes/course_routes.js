const express = require("express");
const router = express.Router();
const courseController = require("../controller/course_controller");

const authenticateJWT = require("../middleware/authenticator");

// Create a course
router.post("/", courseController.createCourse);

// Fetch all courses
router.get("/courses", courseController.getAllCourses);

// Fetch course by ID
router.get("/courses/:id", courseController.getCourseById);

// Update course by ID
router.put("/courses/:id", courseController.updateCourse);

// Delete course by ID
router.delete("/courses/:id", courseController.deleteCourse);

module.exports = router;
