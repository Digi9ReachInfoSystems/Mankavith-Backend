const AboutUs = require("../model/aboutUsModel");

exports.createAboutUs = async (req, res) => {
    const { title, description } = req.body;

    try {
        const aboutUs = new AboutUs({ title, description });
        await aboutUs.save();
        res.status(201).json(aboutUs);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create about us" });
    }
};

exports.updateAboutUs = async (req, res) => {
    const { aboutUsId } = req.params;
    const { title, description } = req.body;

    try {
        const aboutUs = await AboutUs.findByIdAndUpdate(aboutUsId, { title, description }, { new: true });
        if (!aboutUs) {
            return res.status(404).json({ error: "About us not found" });
        }
        res.json(aboutUs);  
    } catch (error) {
        res.status(500).json({ error: "Failed to update about us" });
    }
};

exports.getAllAboutUs = async (req, res) => {
    try {
        const aboutUs = await AboutUs.find();
        res.status(200).json(aboutUs);
    } catch (error) {
        res.status(500).json({ error: "Failed to get about us" });
    }
};

exports.deleteAboutUs = async (req, res) => {
    const { aboutUsId } = req.params;

    try {
        const aboutUs = await AboutUs.findByIdAndDelete(aboutUsId);
        if (!aboutUs) {
            return res.status(404).json({ error: "About us not found" });
        }
        res.json({ message: "About us deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete about us" });
    }
}