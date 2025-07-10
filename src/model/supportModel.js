const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema({
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
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