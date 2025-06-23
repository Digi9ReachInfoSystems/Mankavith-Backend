const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { fromBuffer } = require('pdf2pic');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
exports.generateCertificate = async (name, course) => {
    try {
        // const { name, course } = req.body;

        const templatePath = path.join(__dirname, '../templates/certificate_template.pdf');
        const existingPdfBytes = fs.readFileSync(templatePath);

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        const pageWidth = firstPage.getWidth();
        const nameFontSize = 24;

        // Measure the name text width and center it
        const nameTextWidth = font.widthOfTextAtSize(name, nameFontSize);
        const nameX = (pageWidth - nameTextWidth) / 2;

        firstPage.drawText(name, {
            x: nameX,
            y: 310,
            size: nameFontSize,
            font,
            color: rgb(0, 0, 0),
        });

        // Optional: center course name too
        const courseFontSize = 18;
        const courseTextWidth = font.widthOfTextAtSize(course, courseFontSize);
        const courseX = (pageWidth - courseTextWidth) / 2;

        firstPage.drawText(course, {
            x: courseX,
            y: 250,
            size: courseFontSize,
            font,
            color: rgb(0, 0, 0),
        });

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const dateFontSize = 12;
        const dateTextWidth = font.widthOfTextAtSize(formattedDate, dateFontSize);
        const dateX = pageWidth - dateTextWidth - 210; // Adjust 40 for padding from the right

        firstPage.drawText(formattedDate, {
            x: dateX,
            y: 100,
            size: dateFontSize,
            font,
            color: rgb(0, 0, 0),
        });

        const pdfBytes = await pdfDoc.save();
        const uploadedFile = await uploadFile({
            originalname: `certificate-${name}.pdf`,
            buffer: pdfBytes
        });
        console.log('File uploaded successfully:', uploadedFile);
        //     const pdf2picOptions = {
        //       format: 'png',
        //       width: 2550,
        //       height: 3300,
        //       density: 330,
        //       savePath: './output/from-buffer-to-base64',
        //     }

        //     const convert = fromBuffer(pdfBytes, pdf2picOptions)

        //  const pageOutput = await convert(1); 
        const pngBuffer = await convertPdfToPngBuffer(pdfBytes);
        console.log('PNG conversion successful', pngBuffer.length, 'bytes');
        const pngUpload = await uploadFile({
            originalname: `certificate-${name}.png`,
            buffer: pngBuffer,
        });
        console.log('PNG uploaded:', pngUpload.blobUrl);
        return ({
            message: 'Certificate generated successfully',
            pdfUrl: uploadedFile.blobUrl,
        });

        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', 'inline; filename=certificate.pdf');
        // res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
};

async function uploadFile(file) {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        sharedKeyCredential
    );
    const blobName = `${Date.now()}-${file.originalname}`;
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const contentType = getContentType(fileExtension);
    const contentDisposition = getContentDisposition(fileExtension, file.originalname);

    const uploadOptions = {
        blobHTTPHeaders: {
            blobContentType: contentType,
            blobContentDisposition: contentDisposition
        }
    };
    await blockBlobClient.uploadData(file.buffer, uploadOptions);
    const blobUrl = blockBlobClient.url;

    return ({
        message: 'File uploaded successfully',
        blobName,
        blobUrl,
        contentType
    });

}
function getContentType(extension) {
    const mimeTypes = {
        'pdf': 'application/pdf',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[extension] || 'application/octet-stream';
}

function getContentDisposition(extension, originalName) {
    // Force download for PDF and other document types
    const forceDownloadTypes = ['pdf', 'doc', 'docx'];
    return forceDownloadTypes.includes(extension)
        ? `attachment; filename="${originalName}"`
        : 'inline';
}

async function convertPdfToPngBuffer(pdfBytes) {
    console.log('Converting PDF to PNG buffer...');
    const options = {
        density: 150,             // Higher = better quality
        format: 'png',
        width: 1200,
        height: 900,
        savePath: '',             // Prevent saving to file
    };
    console.log('PDF bytes length:', pdfBytes.length);
    console.log('Conversion options:', options);

    const convert = fromBuffer(pdfBytes, options);
    console.log('PDF to PNG conversion function created', convert);
    const result = await convert(1, { responseType: 'buffer' }); // Convert 1st page, no file saving
    console.log('PDF to PNG conversion result:', result);
    return result.buffer; // This is your PNG buffer
}
