const mongoose = require("mongoose");

const tickerSchema = new mongoose.Schema({

    title : {
        type: String,
        required: true,
    }
    });

    module.exports = mongoose.model("Ticker", tickerSchema);