const Mission = require("../model/missionModel.js");

exports.createMission = async (req, res) => {
    try {
        const mission = await Mission.create(req.body);
        res.status(201).json(mission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getAllMission = async (req, res) => {
    try {
        const missions = await Mission.find();
        res.status(200).json(missions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMissionById = async (req, res) => {
    try {
        const mission = await Mission.findById(req.params.id);
        res.status(200).json(mission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMissionById = async (req, res) => {
    try {
        const mission = await Mission.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(mission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteMissionById = async (req, res) => {
    try {
        const mission = await Mission.findByIdAndDelete(req.params.id);
        res.status(200).json(mission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

