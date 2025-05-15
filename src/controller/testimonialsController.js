const Testimonials = require("../model/testimonialsModel");

exports.createTestimonials = async (req, res) => {
    const { name, rank, description,testimonial_image } = req.body;

    try {
        const testimonials = new Testimonials({ name, rank, description,testimonial_image });
        await testimonials.save();
        res.status(201).json(testimonials);
        res.status(201).json({ message: "Testimonials created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error creating testimonials" });
    }
};

exports.getTestimonialsById = async (req, res) => {
    const { id } = req.params;
    try {
        const testimonials = await Testimonials.findById(id);
        if (!testimonials) {
            return res.status(404).json({ error: "Testimonials not found" });
        }
        res.status(200).json(testimonials);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve testimonials" });
    }
};

exports.getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonials.find();
        res.status(200).json(testimonials);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve testimonials" });
    }
};


exports.updateTestimonialsById = async (req, res) => {
    const { id } = req.params;
    const { name, rank, description,testimonial_image } = req.body;
    try {
        const testimonials = await Testimonials.findByIdAndUpdate(id, { name, rank, description, testimonial_image }, { new: true });
        if (!testimonials) {
            return res.status(404).json({ error: "Testimonials not found" });
        }
        res.status(200).json(testimonials);
    } catch (error) {
        res.status(500).json({ error: "Failed to update testimonials" });
    }
};

exports.deleteTestimonialsById = async (req, res) => {
    const { id } = req.params;
    try {
        await Testimonials.findByIdAndDelete(id);
        res.json({ message: "Testimonials deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete testimonials" });
    }
};