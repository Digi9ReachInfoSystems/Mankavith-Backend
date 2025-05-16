const Aspirant =  require("../model/aspirantModel");

exports.createAspirant = async (req, res) => {
    try {
        const aspirant = await Aspirant.create(req.body);
        res.status(201).json(aspirant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllAspirants = async (req, res) => {
    try {
        const aspirants = await Aspirant.find();
        res.status(200).json(aspirants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAspirantById = async (req, res) => {
    try {
        const aspirant = await Aspirant.findById(req.params.id);
        res.status(200).json(aspirant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.updateAspirantById = async (req, res) => {
    try {
        const aspirant = await Aspirant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(aspirant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.deleteAspirantById = async (req, res) => {
    try {
        const aspirant = await Aspirant.findByIdAndDelete(req.params.id);
        res.status(200).json(aspirant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}