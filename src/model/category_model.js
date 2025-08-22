const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  featured: { type: Boolean, default: false },
});

module.exports = mongoose.model("Category", categorySchema);
