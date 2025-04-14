const mongoose = require("mongoose");

const entranceScema = new mongoose.Schema({
    title: { type: String, required: true },
    description : { type: String, required: true },

});

module.exports = mongoose.model("Entrance", entranceScema);