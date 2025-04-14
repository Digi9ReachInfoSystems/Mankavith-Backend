const express = require('express');
const { createSubject, getAllSubjects, getSubjectById, updateSubject, deleteSubject } = require('../controller/subject_controller');
const authenticateJWT = require('../middleware/authenticator');

const router = express.Router();

// Create a new subject
router.post('/subjects',authenticateJWT, createSubject);

// Get all subjects
router.get('/subjects',authenticateJWT, getAllSubjects);

// Get subject by ID
router.get('/subjects/:id',authenticateJWT, getSubjectById);

// Update subject by ID
router.put('/subjects/:id',authenticateJWT, updateSubject);

// Delete subject by ID
router.delete('/subjects/:id',authenticateJWT, deleteSubject);

module.exports = router;
