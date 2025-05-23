const Support = require("../model/supportModel");

exports.createSupport = async (req, res) => {
    try {
        const { userRef, description } = req.body;

        const newSupport = new Support({ 
            userRef, 
            description 
        });

        const savedSupport = await newSupport.save();
        
        // Populate after saving
        const populatedSupport = await Support.findById(savedSupport._id)
            .populate("userRef", "name email");
            
        res.status(201).json(populatedSupport);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSupportById = async (req, res) => {
    try {
        const supportId = req.params.id;
        const support = await Support.findById(supportId)
            .populate("userRef", "name email");
        if (!support) {
            return res.status(404).json({ error: "Support not found" });
        }
        res.status(200).json(support);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllSupports = async (req, res) => {
    try {
        const supports = await Support.find()
            .populate("userRef", "name email");
        res.status(200).json(supports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSupportById = async (req, res) => {
    try {
        const supportId = req.params.id;
        const deletedSupport = await Support.findByIdAndDelete(supportId);
        if (!deletedSupport) {
            return res.status(404).json({ error: "Support not found" });
        }
        res.status(200).json({ message: "Support deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.approveSupportById = async (req, res) => {
    try {
        const supportId = req.params.id;
        const updatedSupport = await Support.findByIdAndUpdate(supportId, { status: "closed" }, { new: true });
        if (!updatedSupport) {
            return res.status(404).json({ error: "Support not found" });
        }
        res.status(200).json(updatedSupport);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};