const User = require("../model/user_model");

// REGISTER TOKEN (NO AUTH)
exports.registerToken = async (req, res) => {
  try {
    const { userId, token, deviceId, platform } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    // await User.updateOne(
    //   { _id: userId, "fcmTokens.token": { $ne: token } },
    //   {
    //     $push: {
    //       fcmTokens: {
    //         token,
    //         deviceId: deviceId || null,
    //         platform: platform || "unknown",
    //         createdAt: new Date(),
    //       },
    //     },
    //     fcmToken: token, // for backward compatibility
    //   }
    // );
    await User.updateOne(
      { _id: userId },
      {  fcmToken: token, // for backward compatibility
      }
    );

    return res.json({
      success: true,
      message: "Token registered (no auth)",
      userId,
    });
  } catch (err) {
    console.error("Register token error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// UNREGISTER TOKEN (NO AUTH)
exports.unregisterToken = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: "userId and token are required",
      });
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: { token } },
        fcmToken: null
      }
    );

    return res.json({
      success: true,
      message: "Token unregistered (no auth)",
      userId,
    });
  } catch (err) {
    console.error("Unregister token error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
