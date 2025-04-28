const Why = require("../model/whyModel");


exports.createWhy = async (req, res) => {
    try {
        const why = await Why.create(req.body);
        res.status(201).send(why);
    } catch (error) {
        res.status(500).send(error);
    }
};

exports.getAllWhy = async (req, res) => {
    try {
        const why = await Why.find();
        res.status(200).send(why);
    } catch (error) {
        res.status(500).send(error);
    }
}

exports.updateWhyById = async (req, res) => {
    const { whyId } = req.params;
    try {
        const why = await Why.findByIdAndUpdate(whyId, req.body, { new: true });
        res.status(200).send(why);
    } catch (error) {
        res.status(500).send(error);
    }
}

exports.deleteWhyById = async (req, res) => {
    const { whyId } = req.params;
    try {
        const why = await Why.findByIdAndDelete(whyId);
        res.status(200).send(why);
    } catch (error) {
        res.status(500).send(error);
    }
}   