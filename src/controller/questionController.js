const Question = require("../model/questionModel");

exports.addPaper = async (req, res) => {
  try {
    const { title, year, description, question_url } = req.body;
    if (!title || !year || !description || !question_url) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find or create the set by title
    let set = await Question.findOne({ title: title.trim() });

    if (!set) {
      // Create new title with the first paper
      set = await Question.create({
        title: title.trim(),
        papers: [
          {
            year: Number(year),
            description: description.trim(),
            question_url: question_url.trim(),
          },
        ],
      });
      return res.status(201).json(set);
    }

    // If title exists, ensure the year doesn't already exist
    if (set.hasYear(year)) {
      return res.status(409).json({
        message: "This title already has a paper for that year.",
      });
    }

    set.papers.push({
      year: Number(year),
      description: description.trim(),
      question_url: question_url.trim(),
    });
    await set.save();

    return res.status(201).json(set);
  } catch (err) {
    // Handle duplicate title creation race
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Title already exists" });
    }
    return res.status(500).json({ message: "Error adding paper" });
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