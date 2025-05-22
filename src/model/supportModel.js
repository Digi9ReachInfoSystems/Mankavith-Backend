const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema({
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["open", "closed"],
        default: "open",
    },
    createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Support", supportSchema);