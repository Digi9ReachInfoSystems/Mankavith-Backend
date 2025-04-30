const express = require("express");
const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require("../controller/subject_controller");
const authenticateJWT = require("../middleware/authenticator");

const router = express.Router();

// Create a new subject
router.post("/", createSubject);

// Get all subjects
router.get("/", getAllSubjects);

// Get subject by ID
router.get("//:id", getSubjectById);

// Update subject by ID
router.put("//:id", updateSubject);

// Delete subject by ID
router.delete("/:id", deleteSubject);

module.exports = router;
