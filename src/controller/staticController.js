const Static = require("../model/staticModel");

exports.createStatic = async (req, res) => {
    try {
        const static = await Static.create(req.body);
        res.status(201).send(static);
    } catch (error) {
        res.status(500).json({ error: "Failed to create static" });
    }
};

exports.updateStatic = async (req, res) => {
    const { staticId } = req.params;
    try {
        const static = await Static.findByIdAndUpdate(staticId, req.body, { new: true });
        res.status(200).send(static);
    } catch (error) {
        res.status(500).send(error);
    }
};