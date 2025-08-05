const express = require('express');
const { createNote, getAllNotes, getNoteById, updateNote, deleteNote, getNoOfNotes, bulkDeleteNotes,getAllNotesBySubjectIds, rearrangeNotes } = require('../controller/notes_controller');
const authenticateJWT = require('../middleware/authenticator');
const multer = require('multer');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/total', authenticateJWT, getNoOfNotes);
router.post('/notes', authenticateJWT, createNote);
router.get('/notes', authenticateJWT, getAllNotes);
router.get('/notes/:id', authenticateJWT, getNoteById);
router.put('/notes/:id', authenticateJWT, updateNote);
router.delete('/notes/:id', authenticateJWT, deleteNote);
router.delete('/notes/bulk/delete', authenticateJWT, bulkDeleteNotes);
router.post("/allNotes/bySubjectIds", authenticateJWT, getAllNotesBySubjectIds);
router.put("/rearrangeNotes",rearrangeNotes);

module.exports = router;
