const express = require('express');
const { createNote, getAllNotes, getNoteById, updateNote, deleteNote, getNoOfNotes,bulkDeleteNotes } = require('../controller/notes_controller');
const authenticateJWT = require('../middleware/authenticator');
const multer = require('multer');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/total', getNoOfNotes);

// Create a new note
router.post('/notes', createNote);

// Get all notes
router.get('/notes', getAllNotes);

// Get note by ID
router.get('/notes/:id', getNoteById);

// Update note by ID
router.put('/notes/:id', updateNote);

// Delete note by ID
router.delete('/notes/:id', deleteNote);

router.delete('/notes/bulk/delete',bulkDeleteNotes);


module.exports = router;
