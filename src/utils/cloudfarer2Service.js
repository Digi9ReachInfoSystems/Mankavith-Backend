const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const r2 = new S3Client({
  region: "auto",  // R2 uses "auto"
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const uploadToR2 = async (file) => {
  const key = `${uuidv4()}-${file.originalname}`;

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  // Use custom domain for WAF protection
  return `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
};

module.exports = { uploadToR2 };
