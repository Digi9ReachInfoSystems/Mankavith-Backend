const Content = require("../model/contentModel");

exports.createContent = async (req, res) => {
    const { title, description } = req.body;

    try {
        const content = new Content({ title, description });
        await content.save();
        res.status(201).json(content);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create content" });
    }
};

exports.updateContent = async (req, res) => {
    const { contentId } = req.params;
    const { title, description } = req.body;

    try {
        const content = await Content.findByIdAndUpdate(contentId, { title, description }, { new: true });
        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: "Failed to update content" });
    }
};

exports.getContentById = async (req, res) => {
    const { contentId } = req.params; // Destructure 'id' from params

    try {
        const content = await Content.findById(contentId); // Use 'id' instead of 'contentId'

        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }
        res.status(200).json(content);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve content" });
    }
};
   
exports.getAllContents = async (req, res) => {
    try {
        const contents = await Content.find();
        res.json(contents);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve contents" });
    }
};

exports.deleteContentById = async (req, res) => {
    const { contentId } = req.params;

    try {
        const content = await Content.findByIdAndDelete(contentId);
        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }
        res.json({ message: "Content deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete content" });
    }
};