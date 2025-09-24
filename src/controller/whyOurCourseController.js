const WhyOurCourse = require("../model/whyOurCourseModel");


exports.createWhyOurCourse = async (req, res) => {
    try {
        const { title, description, image } = req.body;
        const whyOurCourse = new WhyOurCourse({ title, description, image });
        await whyOurCourse.save();
        res.status(201).json({success: true,message:"whyOurCourse created successfully" , data: whyOurCourse});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllWhyOurCourse = async (req, res) => {
    try {
        const whyOurCourse = await WhyOurCourse.find();
        res.status(200).json({success: true, data: whyOurCourse});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateWhyOurCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, image } = req.body;
        const whyOurCourse = await WhyOurCourse.findByIdAndUpdate(id, { title, description, image }, { new: true });
        res.status(200).json({success: true, data: whyOurCourse});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteWhyOurCourse = async (req, res) => {
    try {
        const { id } = req.params;
        await WhyOurCourse.findByIdAndDelete(id);
        res.status(200).json({success: true, message: "whyOurCourse deleted successfully"});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getWhyOurCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const whyOurCourse = await WhyOurCourse.findById(id);
        res.status(200).json({success: true, data: whyOurCourse});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};