const Ticker = require("../model/tickerModel");

exports.createTicker = async (req, res) => {
    const { title } = req.body;

    try {
        const ticker = new Ticker({ title });
        await ticker.save();
        res.status(201).json(ticker);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create ticker" });
    }
};

exports.getTickerByid = async (req, res) => {
    const { id } = req.params;

    try {
        const ticker = await Ticker.findById(id);
        if (!ticker) {
            return res.status(404).json({ error: "Ticker not found" });
        }
        res.status(200).json(ticker);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve ticker" });
    }
};

exports.getAllTickers = async (req, res) => {
    try {
        const tickers = await Ticker.find();
        res.json(tickers);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve tickers" });
    }
};

exports.updateTickerById = async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;

    try {
        const ticker = await Ticker.findByIdAndUpdate(id, { title }, { new: true });
        if (!ticker) {
            return res.status(404).json({ error: "Ticker not found" });
        }
        res.json(ticker);
    } catch (error) {
        res.status(500).json({ error: "Failed to update ticker" });
    }
};

exports.deleteTickerById = async (req, res) => {
    const { id } = req.params;
    try {
        await Ticker.findByIdAndDelete(id);
        res.json({ message: "Ticker deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete ticker" });
    }
};
