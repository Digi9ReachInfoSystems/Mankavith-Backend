const express = require("express");
const router = express.Router();
const studentController = require("../controller/studentController");

router.get("/total", studentController.getTotalStudents);
router.post("/", studentController.createStudent);
router.put("/:id", studentController.editStudent);
router.get("/", studentController.getAllStudents);
router.get("/:studentId", studentController.getStudentById);
router.delete("/:studentId", studentController.deleteStudentById);


module.exports = router;