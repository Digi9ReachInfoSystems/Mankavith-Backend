const axios = require("axios");
const FormData = require("form-data");

const uploadToCloudflareStream = async (fileBuffer, filename) => {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID missing");
  }

  if (!process.env.CLOUDFLARE_STREAM_TOKEN) {
    throw new Error("CLOUDFLARE_STREAM_TOKEN missing");
  }

  const form = new FormData();
  form.append("file", fileBuffer, {
    filename,
    contentType: "video/mp4",
  });

  const response = await axios.post(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream`,
    form,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_TOKEN}`,
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  if (!response.data.success) {
    console.error(response.data);
    throw new Error("Cloudflare Stream upload failed");
  }

  const streamData = response.data.result;

  return {
    streamId: streamData.uid,
    hlsUrl: streamData.playback.hls,   // ✅ .m3u8
    dashUrl: streamData.playback.dash,
    thumbnail: streamData.thumbnail,
  };
};

module.exports = { uploadToCloudflareStream };
