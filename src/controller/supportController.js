const { sendContactUsMailToAdmin } = require("../middleware/mailService");
const Support = require("../model/supportModel");
const User = require("../model/user_model");

exports.createSupport = async (req, res) => {
    try {
        const { name, email, description } = req.body;

        const newSupport = new Support({
            name,
            email,
            description
        });

        const savedSupport = await newSupport.save();
        const admins = await User.find({ role: "admin" });

        Promise.all(
            admins.map(async (admin) => {
                await sendContactUsMailToAdmin(name, email, description, admin.email);
            })
        );

        // Populate after saving
        const populatedSupport = await Support.findById(savedSupport._id)
            .populate("userRef",);

        res.status(201).json(populatedSupport);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSupportById = async (req, res) => {
    try {
        const supportId = req.params.id;
        const support = await Support.findById(supportId)
            .populate("userRef",);
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

exports.bulkDeleteSupports = async (req, res) => {
    try {
        const { ids } = req.body;
        let result = [];
        for (let id of ids) {
            const support = await Support.findById(id);
            if (!support) {
                result.push({ success: false, supportId: id, message: "Support not found" });
            } else {
                await Support.findByIdAndDelete(id);
                result.push({ success: true, supportId: id, message: "Support deleted successfully" });
            }
        }
        res.status(200).json({ success: true, message: "Supports deleted successfully", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};