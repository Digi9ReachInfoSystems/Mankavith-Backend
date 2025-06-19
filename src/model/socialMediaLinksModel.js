const mongoose = require("mongoose");


const socialMediaLinksSchema = new mongoose.Schema({
    youtubeChannel: { type: String, required: false },
    facebook: { type: String, required: false },
    instagram: { type: String, required: false },
    twitter: { type: String, required: false },
    Whatsapp: { type: String, required: false },
    linkedin: { type: String, required: false },
    teligram: { type: String, required: false },
    youtube_videoLink: [
        {
            thumbnailImage: {
                type: String,
                required: false
            },
            video_link: {
                type: String,
                required: false
            },
            homepage: {
                type: Boolean,
                default: false
            }
        }
    ],


});

module.exports = mongoose.model("SocialMediaLinks", socialMediaLinksSchema);