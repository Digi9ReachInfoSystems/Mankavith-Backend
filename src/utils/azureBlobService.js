const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

exports.uploadNotestest = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
        const containerName = req.body.containerName || process.env.AZURE_STORAGE_CONTAINER_NAME;
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

        const blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            sharedKeyCredential
        );

        const blobName = `${Date.now()}-${req.file.originalname}`;
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Get file extension and set content type
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        const contentType = getContentType(fileExtension);
        
        // Set appropriate content disposition
        const contentDisposition = getContentDisposition(fileExtension, req.file.originalname);

        const uploadOptions = {
            blobHTTPHeaders: {
                blobContentType: contentType,
                blobContentDisposition: contentDisposition
            }
        };

        await blockBlobClient.uploadData(req.file.buffer, uploadOptions);
        const blobUrl = blockBlobClient.url;

        return res.status(200).json({ 
            message: 'File uploaded successfully', 
            blobName, 
            blobUrl,
            contentType
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error uploading file', 
            error: error.message 
        });
    }
};

// Helper functions
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