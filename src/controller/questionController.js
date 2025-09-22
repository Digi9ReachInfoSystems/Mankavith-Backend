const Question = require("../model/questionModel");

exports.addPaper = async (req, res) => {
  try {
    const { title, year, question_url } = req.body;
    if (!title || !year || !question_url) {
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
            // description: description.trim(),
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
      //   description: description.trim(),
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

exports.getQuestionPaperByTitle = async (req, res) => {
  const { title } = req.params;
  try {
    const question = await Question.findOne({ title });
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve question" });
  }
};

exports.getQuestionPaperByTitleAndYear = async (req, res) => {
  const { title, year } = req.params;
  try {
    const question = await Question.findOne({ title, "papers.year": Number(year) });
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    const paper = question.papers.find((paper) => paper.year === Number(year));
    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }
    res.status(200).json({
      title: question.title,
      year: paper.year,
      // description: paper.description,
      question_url: paper.question_url,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve question" });
  }
};

exports.removeQuestionPaper = async (req, res) => {
  const { title, year } = req.params;
  try {
    const question = await Question.findOneAndUpdate(
      { title },
      { $pull: { papers: { year: Number(year) } } },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to remove question" });
  }
}

exports.addQuestionPaper = async (req, res) => {
  const { title } = req.params;
  const { year, question_url } = req.body;
  try {
    const questionData = await Question.findOne({ title, "papers.year": Number(year) });
    if (questionData) {
      return res.status(409).json({ message: "This title already has a paper for that year." });
    }
    const question = await Question.findOneAndUpdate(
      { title },
      { $push: { papers: { year: Number(year), question_url: question_url } } },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to add question" });
  }
}

exports.getAllQuestionpapers = async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve questions" });
  }
};

exports.updateQuestionPaper = async (req, res) => {
  const { title, year } = req.params;
  const { question_url } = req.body;
  try {
    const question = await Question.findOne(
      {
        title,
        "papers.year": Number(year),
      }
    )

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    // question.papers[0].description = description;
    question.papers[0].question_url = question_url;
    await question.save();
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to update question" });
  }
};
exports.deletePaper = async (req, res) => {
  try {
    const { title, year } = req.params;
    const yr = Number(year);

    // 1) Ensure the set exists
    const set = await Question.findOne({ title: title.trim() });
    if (!set) return res.status(404).json({ error: "Question set not found" });

    // 2) Ensure the paper (year) exists in the array
    const hasYear = set.papers.some(p => p.year === yr);
    if (!hasYear) {
      return res.status(404).json({ error: `Paper for year ${yr} not found` });
    }

    // 3) Pull just that paper (array element) out
    await Question.updateOne(
      { _id: set._id },
      { $pull: { papers: { year: yr } } }
    );

    // (Optional) return the updated document
    const updated = await Question.findById(set._id);
    return res.json({
      message: `Paper for year ${yr} deleted successfully`,
      data: updated
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete paper" });
  }
};

exports.bulkDeletePapers = async (req, res) => {
  try {

    const { papperInfo } = req.body;

    // 1) Ensure the set exists
    let result = [];
    for (let i = 0; i < papperInfo.length; i++) {
      const { title, years } = papperInfo[i];
      try {
        const set = await Question.findOne({ title: title.trim() });
        if (!set) return res.status(404).json({ error: "Question set not found" });

        // 2) Pull just that paper (array element) out
       const res = await Question.updateOne(
          { _id: set._id },
          { $pull: { papers: { year: { $in: years } } } }
        );
        if(res.set.papers.length === 0){
          await Question.deleteOne({ _id: set._id });
        }
        // (Optional) return the updated document
        const updated = await Question.findById(set._id);
        result.push({ success: true, papperInfo: papperInfo[i], data: updated });
      } catch (err) {
        result.push({ success: false, papperInfo: papperInfo[i], message: "Server error", error: err.message });
      }
    }
    return res.json({
      message: "Papers deleted successfully",
      data: result
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete paper" });
  }
};