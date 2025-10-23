const Previous = require("../model/examModel");
const  Question = require("../model/questionModel");
exports.createExam = async (req, res) => {
    const {  title,description } = req.body;

    try {
        const previous = new Previous({  title,description});
        await previous.save();
        res.status(201).json(previous);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create previous question" });
    }
};

exports.getExamById = async (req, res) => {
    const { id } = req.params;

    try {
        const previous = await Previous.findById(id);

        if (!previous) {
            return res.status(404).json({ error: "Previous question not found" });
        }
        res.status(200).json(previous);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve previous question" });
    }
};

exports.getAllExam = async (req, res) => {
    try {
        const previous = await Previous.find();
        res.json(previous);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve previous questions" });
    }
};

exports.updateExam = async (req, res) => {
    const { id } = req.params;
    const { year, title } = req.body;
    try {
        const previous = await Previous.findByIdAndUpdate(id, { year, title }, { new: true });
        if (!previous) {
            return res.status(404).json({ error: "Previous question not found" });
        }
        res.status(200).json(previous);
    } catch (error) {
        res.status(500).json({ error: "Failed to update previous question" });
    }
};

exports.deleteExam = async (req, res) => {
    const { id } = req.params;
    try {
        const previous = await Previous.findByIdAndDelete(id);
        if (!previous) {
            return res.status(404).json({ error: "Previous question not found" });
        }
        res.json({ message: "Previous question deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete previous question" });
    }
}