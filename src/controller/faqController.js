const Faq = require("../model/faqModel");

exports.createFaq = async (req, res) => {
    const { question, answer } = req.body;

    try {
        const faq = new Faq({ question, answer });
        await faq.save();
        res.status(201).json(faq);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create FAQ" });
    }
}

exports.getAllFaqs = async (req, res) => {
    try {
        const faqs = await Faq.find();
        res.json(faqs);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve FAQs" });
    }
}

exports.getFaqById = async (req, res) => {
    const { id } = req.params;

    try {
        const faq = await Faq.findById(id);

        if (!faq) {
            return res.status(404).json({ error: "FAQ not found" });
        }
        res.status(200).json(faq);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve FAQ" });
    }
}

exports.deleteFaqById = async (req, res) => {
    const { faqId } = req.params;

    try {
        const faq = await Faq.findByIdAndDelete(faqId);
        if (!faq) {
            return res.status(404).json({ error: "FAQ not found" });
        }
        res.json({ message: "FAQ deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete FAQ" });
    }
}

exports.updateFaqById = async (req, res) => {
    const { faqId } = req.params;
    const { question, answer } = req.body;

    try {
        const faq = await Faq.findByIdAndUpdate(faqId, { question, answer }, { new: true });
        if (!faq) {
            return res.status(404).json({ error: "FAQ not found" });
        }
        res.json(faq);
    } catch (error) {
        res.status(500).json({ error: "Failed to update FAQ" });
    }
}

exports.bulkDeleteFaqs = async (req, res) => {
    try {
        const { ids } = req.body;
        let result = [];
        for (let id of ids) {
            const faq = await Faq.findById(id);
            if (!faq) {
                result.push({ success: false, faqId: id, message: "FAQ not found" });
            } else {
                await Faq.findByIdAndDelete(id);
                result.push({ success: true, faqId: id, message: "FAQ deleted successfully" });
            }
        }
        res.status(200).json({ success: true, message: "FAQs deleted successfully", result });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete FAQs" });
    }
}