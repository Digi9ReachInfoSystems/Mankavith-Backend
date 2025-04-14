const Achiever = require("../model/achieverModel");

exports.createAchievers = async (req, res) => {
    const { name, rank } = req.body;

    try {
        const achiever = new Achiever({ name, rank });
        await achiever.save();
        res.status(201).json(achiever);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create achiever" });
    }
};

exports.getAchieversById = async (req, res) => {
    const { id } = req.params;
    try {
        const achiever = await Achiever.findById(id);
        if (!achiever) {
            return res.status(404).json({ error: "Achiever not found" });
        }
        res.status(200).json(achiever);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to get achiever" });
    }
};

exports.getAllAchievers = async (req, res) => {
    try {
        const achievers = await Achiever.find();
        res.status(200).json(achievers);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to get achievers" });
    }
};

exports.updateAchiever = async (req, res) => {
    const { id } = req.params;
    const { name, rank } = req.body;
    try {
        const achiever = await Achiever.findByIdAndUpdate(id, { name, rank }, { new: true });
        if (!achiever) {
            return res.status(404).json({ error: "Achiever not found" });
        }
        res.status(200).json(achiever);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to update achiever" });
    }
};

exports.deleteAchiever = async (req, res) => {
    const { id } = req.params;
    try {
        await Achiever.findByIdAndDelete(id);
        res.json({ message: "Achiever deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete achiever" });
    }
};