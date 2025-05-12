const Question = require("../model/questionModel");

exports.createQuestion = (req, res) => {


    const { title, year,description, question_url } = req.body;
    try {
        const question = new Question({ title, year,description, question_url });
        question.save();
       return res.status(201).json(question);
        // res.status(201).json({ message: "Question created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error creating question" });
    }
};

exports.getQuestionPaperById = async (req, res) => {
    const { id } = req.params;
    try {
        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }
        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve question" });
    }
};

exports.getAllQuestionpapers = async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve questions" });
    }
};

exports.updateQuestionPaper = async (req, res) => {
    const { id } = req.params;
    const { title, year, description, question_url } = req.body;
    try {
        const question = await Question.findByIdAndUpdate(id, { title, year, description, question_url }, { new: true });
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }
        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ error: "Failed to update question" });
    }
};

exports.deleteQuestionPaper = async (req, res) => {
    const { id } = req.params;
    try {
        const question = await Question.findByIdAndDelete(id);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }
        res.json({ message: "Question deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete question" });
    }
};