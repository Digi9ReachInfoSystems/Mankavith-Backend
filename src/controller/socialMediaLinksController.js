const { x64 } = require("crypto-js");
const SocialMediaLinks = require("../model/socialMediaLinksModel");

exports.createSocialMediaLinks = async (req, res) => {
    try {
        const socialMediaLinks = new SocialMediaLinks(req.body);
        await socialMediaLinks.save();
        res.status(201).json(socialMediaLinks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getSocialMediaLinks = async (req, res) => {
    try {
        const socialMediaLinks = await SocialMediaLinks.find();
        res.status(200).json({ success: true, message: "Social media links fetched successfully", data: socialMediaLinks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updataSocialMediaLinks = async (req, res) => {
    try {
        const { youtubeChannel, facebook, instagram, twitter, Whatsapp, linkedin, teligram, youtube_videoLink } = req.body;
        const socialMediaLinks = await SocialMediaLinks.findOne({});
        if (!socialMediaLinks) {
            return res.status(404).json({ error: "Social media links not found" });
        }
        socialMediaLinks.youtubeChannel = youtubeChannel || socialMediaLinks.youtubeChannel;
        socialMediaLinks.facebook = facebook || socialMediaLinks.facebook;
        socialMediaLinks.instagram = instagram || socialMediaLinks.instagram;
        socialMediaLinks.twitter = twitter || socialMediaLinks.twitter;
        socialMediaLinks.Whatsapp = Whatsapp || socialMediaLinks.Whatsapp;
        socialMediaLinks.linkedin = linkedin || socialMediaLinks.linkedin;
        socialMediaLinks.teligram = teligram || socialMediaLinks.teligram;
        socialMediaLinks.youtube_videoLink = youtube_videoLink || socialMediaLinks.youtube_videoLink;
        const savedSocialMediaLinks = await socialMediaLinks.save();
        res.status(200).json({ success: true, data: savedSocialMediaLinks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getHomepageVideo = async (req, res) => {
    try {
        const socialMediaLinks = await SocialMediaLinks.findOne()
            .select('youtube_videoLink')
            .lean();

        if (!socialMediaLinks) {
            return res.status(404).json({
                success: false,
                message: "Social media links not found"
            });
        }

        const homepageVideos = socialMediaLinks.youtube_videoLink.filter(
            video => video.homepage
        );

        if (homepageVideos.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No videos marked for homepage"
            });
        }


        res.status(200).json({
            success: true,
            message: "Homepage video fetched successfully",
            data: {
                video: homepageVideos,
                totalHomepageVideos: homepageVideos.length
            }
        });

    } catch (error) {
        console.error("Error fetching homepage video:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error.message
        });
    }
};
exports.getAllYoutubeVideos = async (req, res) => {
    try {
        const socialMediaLinks = await SocialMediaLinks.findOne()
            .select('youtube_videoLink')
            .lean();

        if (!socialMediaLinks) {
            return res.status(404).json({
                success: false,
                message: "Social media links not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "All youtube videos fetched successfully",
            data: socialMediaLinks.youtube_videoLink
        });
    } catch (error) {
        console.error("Error fetching all youtube videos:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error.message
        });
    }
};

exports.setHomepageVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const foundVideo = await SocialMediaLinks.findOne({
            "youtube_videoLink._id": videoId
        })
        if (!foundVideo) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            });
        }

        await SocialMediaLinks.updateMany(
            {},
            { $set: { "youtube_videoLink.$[].homepage": false } }
        );

        const result = await SocialMediaLinks.updateOne(
            { "youtube_videoLink._id": videoId },
            { $set: { "youtube_videoLink.$.homepage": true } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({
                success: false,
                message: "Video not found or no changes made"
            });
        }

        res.status(200).json({
            success: true,
            message: "Homepage video updated successfully"
        });

    } catch (error) {
        console.error("Error setting homepage video:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error.message
        });
    }
};

exports.addYoutubeVideo = async (req, res) => {
    try {
        const { thumbnailImage, video_link } = req.body;
        if (!thumbnailImage || !video_link) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const result = await SocialMediaLinks.updateOne(
            {},
            {
                $push: {
                    youtube_videoLink: {
                        thumbnailImage,
                        video_link,

                    }
                }
            },
            { upsert: true }
        );

        res.status(201).json({
            success: true,
            message: "Video added successfully",
            data: result
        });

    } catch (error) {
        console.error("Error adding video:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};
exports.removeVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        let wasHomepageVideo = false;

        const doc = await SocialMediaLinks.findOne({
            "youtube_videoLink._id": videoId
        });

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            });
        }


        const videoToRemove = doc.youtube_videoLink.find(v => v._id.equals(videoId));
        wasHomepageVideo = videoToRemove?.homepage || false;


        const result = await SocialMediaLinks.updateOne(
            {},
            { $pull: { youtube_videoLink: { _id: videoId } } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({
                success: false,
                message: "Video not found or already removed"
            });
        }

        if (wasHomepageVideo) {
            const updatedDoc = await SocialMediaLinks.findOne({});
            if (updatedDoc && updatedDoc.youtube_videoLink.length > 0) {
                await SocialMediaLinks.updateOne(
                    { "youtube_videoLink._id": updatedDoc.youtube_videoLink[0]._id },
                    { $set: { "youtube_videoLink.$.homepage": true } }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: wasHomepageVideo
                ? "Video removed. Homepage video reassigned to the first available video."
                : "Video removed successfully",
            wasHomepageVideo
        });

    } catch (error) {
        console.error("Error removing video:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error.message
        });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const { thumbnailImage, video_link } = req.body;


        const socialMediaDoc = await SocialMediaLinks.findOne({
            "youtube_videoLink._id": videoId
        });

        if (!socialMediaDoc) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            });
        }


        // const currentVideo = socialMediaDoc.youtube_videoLink.find(v => v._id.equals(videoId));
        // const wasHomepageVideo = currentVideo?.homepage || false;


        // if (homepage === true) {
        //     await SocialMediaLinks.updateMany(
        //         {},
        //         { $set: { "youtube_videoLink.$[elem].homepage": false } },
        //         { arrayFilters: [{ "elem._id": { $ne: videoId } }] }
        //     );
        // }

        const updateObj = {};
        if (thumbnailImage !== undefined) updateObj["youtube_videoLink.$.thumbnailImage"] = thumbnailImage;
        if (video_link !== undefined) updateObj["youtube_videoLink.$.video_link"] = video_link;
        updateObj["youtube_videoLink.$.homepage"] = updateObj["youtube_videoLink.$.homepage"] || false;

        const result = await SocialMediaLinks.updateOne(
            { "youtube_videoLink._id": videoId },
            { $set: updateObj }
        );

        if (result.nModified === 0) {
            return res.status(400).json({
                success: false,
                message: "No changes made or video not found"
            });
        }


        // if (wasHomepageVideo && homepage === false) {
        //     const updatedDoc = await SocialMediaLinks.findOne({});
        //     const otherVideos = updatedDoc.youtube_videoLink.filter(v => !v._id.equals(videoId));

        //     if (otherVideos.length > 0) {
        //         await SocialMediaLinks.updateOne(
        //             { "youtube_videoLink._id": otherVideos[0]._id },
        //             { $set: { "youtube_videoLink.$.homepage": true } }
        //         );
        //     }
        // }

        res.status(200).json({
            success: true,
            message: "Video updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Error updating video:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error.message
        });
    }
};
exports.getNonHomepageVideos = async (req, res) => {
    try {
        const socialMediaLinks = await SocialMediaLinks.findOne()
            .select('youtube_videoLink')
            .lean();

        if (!socialMediaLinks) {
            return res.status(404).json({
                success: false,
                message: "Social media links not found"
            });
        }

        const nonHomepageVideos = socialMediaLinks.youtube_videoLink.filter(video => !video.homepage);
        res.status(200).json({
            success: true,
            message: "Non-homepage videos fetched successfully",
            data: nonHomepageVideos
        });
    } catch (error) {
        console.error("Error fetching non-homepage videos:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error.message
        });
    }
};

exports.bulkDeleteYoutubeVideos = async (req, res) => {
  try {
    const { videoIds } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ success: false, message: "No videoIds provided" });
    }

    const result = await SocialMediaLinks.updateMany(
      {},
      { $pull: { youtube_videoLink: { _id: { $in: videoIds } } } }
    );

    res.status(200).json({
      success: true,
      message: "Videos deleted successfully",
      data: result
    });
  } catch (error) {
    console.error("Error deleting videos:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
};