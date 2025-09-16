const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// const r2 = require("./r2Client");
// Helper to convert S3 streams to strings
const streamToString = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
};


exports.createFolder = async (req, res) => {
    const { folder, fileName, content } = req.body;

    const params = {
        Bucket: BUCKET_NAME,
        Key: `${folder}/${fileName}`,
        Body: JSON.stringify(content),
        ContentType: "application/json",
    };

    try {
        const command = new PutObjectCommand(params);
        await s3.send(command);
        res.status(201).send({ message: "File created successfully" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}
exports.deleteFolder = async (req, res) => {
    const { folder, fileName } = req.body;

    const params = {
        Bucket: BUCKET_NAME,
        Key: `${folder}/${fileName}`,
    };

    try {
        const command = new DeleteObjectCommand(params);
        await s3.send(command);
        res.status(200).send({ message: "File deleted successfully" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

exports.updateFileInFolder = async (req, res) => {
    const { folder, fileName, content } = req.body;

    const params = {
        Bucket: BUCKET_NAME,
        Key: `${folder}/${fileName}`,
        Body: JSON.stringify(content),
        ContentType: "application/json",
    }

    try {
        const command = new PutObjectCommand(params);
        await s3.send(command);
        res.status(200).send({ message: "File updated successfully" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

exports.readFile = async (req, res) => {
    const { folder, fileName } = req.query;

    const params = {
        Bucket: BUCKET_NAME,
        Key: `${folder}/${fileName}`,
    };

    try {
        const command = new GetObjectCommand(params);
        const data = await s3.send(command);
        const content = await streamToString(data.Body);
        res.status(200).send(JSON.parse(content));
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

exports.listFiles = async (req, res) => {
    const { folder } = req.query;

    const params = {
        Bucket: BUCKET_NAME,
        Prefix: `${folder}/`,
    };

    try {
        const command = new ListObjectsV2Command(params);
        const data = await s3.send(command);

        const files = data.Contents?.map((item) => item.Key) || [];
        res.status(200).send(files);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

exports.listFolders = async (req, res) => {
    const params = {
        Bucket: BUCKET_NAME,
        Delimiter: "/",
    };

    try {
        const command = new ListObjectsV2Command(params);
        const data = await s3.send(command);

        const folders =
            data.CommonPrefixes?.map((prefix) => prefix.Prefix) || [];
        res.status(200).send(folders);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

exports.duplicateFolders = async (req, res) => {
    const { sourceFolder, targetFolder } = req.body;

    const listParams = {
        Bucket: BUCKET_NAME,
        Prefix: `${sourceFolder}/`,
    };

    try {
        // List all objects in the source folder
        const listCommand = new ListObjectsV2Command(listParams);
        const listData = await s3.send(listCommand);

        if (!listData.Contents || listData.Contents.length === 0) {
            return res
                .status(404)
                .send({ message: "Source folder is empty or not found" });
        }

        // Copy each object to the target folder
        const copyPromises = listData.Contents.map(async (item) => {
            const copyParams = {
                Bucket: BUCKET_NAME,
                CopySource: `${BUCKET_NAME}/${item.Key}`,
                Key: item.Key.replace(sourceFolder, targetFolder),
            };
            const copyCommand = new PutObjectCommand(copyParams);
            return s3.send(copyCommand);
        });

        await Promise.all(copyPromises);
        res.status(201).send({ message: "Folder duplicated successfully" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

exports.renameFolder = async (req, res) => {
    const { sourceFolder, targetFolder } = req.body;

    const listParams = {
        Bucket: BUCKET_NAME,
        Prefix: `${sourceFolder}/`,
    };

    try {
        // List all objects in the source folder
        const listCommand = new ListObjectsV2Command(listParams);
        const listData = await s3.send(listCommand);

        if (!listData.Contents || listData.Contents.length === 0) {
            return res
                .status(404)
                .send({ message: "Source folder is empty or not found" });
        }

        // Copy each object to the target folder and delete original
        const copyAndDeletePromises = listData.Contents.map(async (item) => {
            const newKey = item.Key.replace(sourceFolder, targetFolder);

            // Copy object to new location
            const copyParams = {
                Bucket: BUCKET_NAME,
                CopySource: `${BUCKET_NAME}/${item.Key}`,
                Key: newKey,
            };
            const copyCommand = new PutObjectCommand(copyParams);
            await s3.send(copyCommand);

            // Delete original object
            const deleteParams = {
                Bucket: BUCKET_NAME,
                Key: item.Key,
            };
            const deleteCommand = new DeleteObjectCommand(deleteParams);
            return s3.send(deleteCommand);
        });

        await Promise.all(copyAndDeletePromises);
        res.status(200).send({ message: "Folder renamed successfully" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}
exports.getFileUrl = async (req, res) => {
    try {
        const { fileName } = req.query; // e.g. uploads/image.png
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
        res.json({ url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.uploadFiles = async (req, res) => {
    const folder = req.body.containerName || "ProjectUploads/uploads";
    const file = req.file;

    if (!file) {
        return res.status(400).send({ message: "No files uploaded" });
    }

    try {
        // const uploadPromises = files.map(async (file) => {
        //     const params = {
        //         Bucket: BUCKET_NAME,
        //         Key: `${folder}/${file.originalname}`,
        //         Body: file.buffer,
        //         ContentType: file.mimetype,
        //     };

        //     const command = new PutObjectCommand(params);
        //     // const { fileName } = req.query; // e.g. uploads/image.png
        //     const command22 = new GetObjectCommand({
        //         Bucket: BUCKET_NAME,
        //         Key: `${folder}/${Date.now()}+${file.originalname}`,
        //     });
        //     // const signedUrl = await getSignedUrl(s3, command22, );
        //     // const fileUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${folder}/${file.originalname}`;
        //     // console.log(fileUrl);
        //     return s3.send(command);
        //     // res.json({ url: signedUrl });
        //     // return
        // });
        //     {
        //     "message": "File uploaded successfully",
        //     "blobName": "1757934225523-Penetration Testing - A hands-on introduction to Hacking.docx",
        //     "blobUrl": "https://mankavit.blob.core.windows.net/upload/1757934225523-Penetration%20Testing%20-%20A%20hands-on%20introduction%20to%20Hacking.docx",
        //     "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        // }
        const timestamp = Date.now();
        // const response = await Promise.all(uploadPromises);
        const params = {
            Bucket: BUCKET_NAME,
            Key: `${folder}/${timestamp}${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        const command = new PutObjectCommand(params);
        // const { fileName } = req.query; // e.g. uploads/image.png
        const command22 = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${folder}/${timestamp}${file.originalname}`,
        });
        // const signedUrl = await getSignedUrl(s3, command22, );
        // const fileUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${folder}/${file.originalname}`;
        // console.log(fileUrl);


        const response = await s3.send(command);
        console.log(response);
        res.status(201).send({
            message: "Files uploaded successfully",
            // fileNames: files.map((file) => ({ fileName: file.originalname, url: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${folder}/${file.originalname}` })),
            response,
            blobUrl: `${folder}/${timestamp}${file.originalname}`
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}
exports.accessFile = async (req, res) => {
    try {
        const { fileKey } = req.query;
        // console.log(req.headers.referer, req.headers.origin);

        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: `${fileKey}`,
        });
        const data = await s3.send(command);
        const contentType = data.ContentType || "";
        let extension = ''
        const typeMap = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'application/pdf': '.pdf',
            'text/plain': '.txt',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/msword': '.doc',
            'application/pdf': '.pdf',
            // Add more mappings as needed
        };
        extension = typeMap[contentType] || '';
        // console.log("thisjsj",process.env.ALLOWED_ORIGINS_DATA_ACCESS.includes(req.headers.referer))
        //&&( !['.pdf', '.doc', '.docx'].includes(extension))
        if (!(['.pdf', '.doc', '.docx'].includes(extension))) {
            if (!process.env.ALLOWED_ORIGINS_DATA_ACCESS.includes(req.headers.referer)) {
                return res.status(403).send({ error: "Forbidden" });
            }
        }


        // // set headers (optional: restrict caching)
        // res.setHeader("Content-Type", data.ContentType || "application/octet-stream");
        // res.setHeader("Cache-Control", "no-store");

        // stream back to browser
        // const stream = data.Body;
        // if (stream instanceof PassThrough || typeof stream.pipe === "function") {
        //   stream.pipe(res);
        // } else {
        //   res.send(stream);
        // }
        const command22 = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${fileKey}`,
        });
        const signedUrl = await getSignedUrl(s3, command22, { expiresIn: 60 * 60 * 24 * 2 }); // 5 min
        // res.json({ url: signedUrl });
         res.setHeader("Content-Type", data.ContentType );
        res.redirect(signedUrl);
    } catch (err) {
        console.error(err);
        res.status(404).send({ error: "File not found" });
    }
};

exports.accessFilePDF = async (req, res) => {
    try {
        // console.log("backend is calling")
        const { fileKey } = req.query;
        // console.log(req.headers.referer, req.headers.origin);

        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: `${fileKey}`,
        });
        const data = await s3.send(command);
        const contentType = data.ContentType || "";
        let extension = ''
        const typeMap = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'application/pdf': '.pdf',
            'text/plain': '.txt',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/msword': '.doc',
            'application/pdf': '.pdf',
            // Add more mappings as needed
        };
        extension = typeMap[contentType] || '';
        // console.log("thisjsj",process.env.ALLOWED_ORIGINS_DATA_ACCESS.includes(req.headers.referer))
        //&&( !['.pdf', '.doc', '.docx'].includes(extension))
        if (!(['.pdf', '.doc', '.docx'].includes(extension))) {
            if (!process.env.ALLOWED_ORIGINS_DATA_ACCESS.includes(req.headers.referer)) {
                return res.status(403).send({ error: "Forbidden" });
            }
        }


        // // set headers (optional: restrict caching)
        // res.setHeader("Content-Type", data.ContentType || "application/octet-stream");
        // res.setHeader("Cache-Control", "no-store");

        // stream back to browser
        // const stream = data.Body;
        // if (stream instanceof PassThrough || typeof stream.pipe === "function") {
        //   stream.pipe(res);
        // } else {
        //   res.send(stream);
        // }
        const command22 = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${fileKey}`,
        });
        const signedUrl = await getSignedUrl(s3, command22, { expiresIn: 60 * 60 * 24 * 2 }); // 5 min
        // res.json({ url: signedUrl });
        //  res.setHeader("Content-Type", data.ContentType );
        // console.log("backend is returning data", signedUrl)
       res.json({ url: signedUrl });    
    } catch (err) {
        console.error(err);
        res.status(404).send({ error: "File not found" });
    }
};