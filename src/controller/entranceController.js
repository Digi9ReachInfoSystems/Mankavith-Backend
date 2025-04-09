const Entrance = require("../model/entranceModel");

exports.createEntrance = async (req, res) => {
    try {
        const { title, description } = req.body;
        const newEntrance = new Entrance({ title, description });
        const savedEntrance = await newEntrance.save();
        res.status(201).json(savedEntrance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEntranceById = async (req, res) => {
    try {
        const { id } = req.params;
        const entrance = await Entrance.findById(id);
        if (!entrance) {
            return res.status(404).json({ error: "Entrance not found" });
        }
        res.status(200).json(entrance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllEntrances = async (req, res) => {
    try {
        const entrances = await Entrance.find();
        res.status(200).json(entrances);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateEntranceById = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const updatedEntrance = await Entrance.findByIdAndUpdate(
            id,
            { title, description },
            { new: true }
        );
        if (!updatedEntrance) {
            return res.status(404).json({ error: "Entrance not found" });
        }
        res.status(200).json(updatedEntrance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEntranceById = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEntrance = await Entrance.findByIdAndDelete(id);
        if (!deletedEntrance) { 
            return res.status(404).json({ error: "Entrance not found" });
        }
        res.json({ message: "Entrance deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};