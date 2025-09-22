const express = require("express");
const router = express.Router();
const missionController = require("../controller/missionController");

router.post("/create", missionController.createMission);
router.get("/getAllMissions", missionController.getAllMission);
router.get("/getMissionById/:id", missionController.getMissionById);
router.put("/updateMission/:id", missionController.updateMissionById);
router.delete("/deleteMission/:id", missionController.deleteMissionById);
router.delete("/bulk/deleteMissions", missionController.bulkDeleteMissions);
module.exports = router;