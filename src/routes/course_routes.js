const express = require('express');
const { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse } = require('../controller/course_controller');
const authenticateJWT = require('../middleware/authenticator');

const router = express.Router();

// Create a new course
router.post('/courses',authenticateJWT, createCourse);

// Get all courses
router.get('/courses',authenticateJWT, getAllCourses);

// Get course by ID
router.get('/courses/:id',authenticateJWT, getCourseById);

// Update course by ID
router.put('/courses/:id',authenticateJWT, updateCourse);

// Delete course by ID
router.delete('/courses/:id',authenticateJWT, deleteCourse);

module.exports = router;
