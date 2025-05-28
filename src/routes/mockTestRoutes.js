const express = require('express');
const router = express.Router();
const mockTestController = require('../controller/mockTestController');
// const authMiddleware = require('../middleware/authMiddleware');
// const adminMiddleware = require('../middleware/adminMiddleware');

// Admin routes
router.post('/', mockTestController.createMockTest);

// Public routes
router.get('/', mockTestController.getMockTests);
router.get('/:id', mockTestController.getMockTest);
router.get('/get/allMockTests', mockTestController.getAllMockTests);

module.exports = router;