const express = require('express');
const { createNote, getAllNotes, getNoteById, updateNote, deleteNote } = require('../controller/notes_controller');
const authenticateJWT = require('../middleware/authenticator');
const multer = require('multer');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Create a new note
router.post('/notes',authenticateJWT, createNote);

// Get all notes
router.get('/notes',authenticateJWT, getAllNotes);

// Get note by ID
router.get('/notes/:id',authenticateJWT, getNoteById);

// Update note by ID
router.put('/notes/:id',authenticateJWT, updateNote);

// Delete note by ID
router.delete('/notes/:id',authenticateJWT, deleteNote);


module.exports = router;
