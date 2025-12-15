const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountPath) {
  serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
}

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Firebase service account not found at ${serviceAccountPath}`);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
