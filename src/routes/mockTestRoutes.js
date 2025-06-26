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
router.put("/publish/:id", mockTestController.togglePublishStatus);
router.put("/update/:id", mockTestController.editMockTest);
router.get('/get/subjects/:subjectId', mockTestController.getMockTestBysubjectId);
router.delete('/delete/:id', mockTestController.softDeleteMockTest);
router.put("/addQuestion/:mockTestId", mockTestController.addQuestionToMockTest);
router.put("/removeQuestion/:mockTestId/:questionId", mockTestController.removeQuestionFromMockTest);
router.patch("/editQuestion/:mockTestId/:questionId", mockTestController.editQuestionInMockTest);
router.get("/get/allupcomingMockTests/:userId", mockTestController.getAllUpcomingMockTests);    
module.exports = router;