// routes/certificateRoutes.js
const express = require('express');
const router = express.Router();
const { generateCertificate } = require('../controller/pdfCertificateController');

router.post('/generate-certificate', generateCertificate);
module.exports = router;
