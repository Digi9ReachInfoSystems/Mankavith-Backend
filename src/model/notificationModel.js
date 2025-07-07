const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    time : { type: String, required: true },
    // image: { type: String, required: true },
    notificationType: { type: String, required: true },
},
{
    timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);