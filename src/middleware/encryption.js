module.exports = (encrypt, decrypt) => {
    return {
        decryptRequestBody: (req, res, next) => {
            console.log("decrypting",req.path)
            // add paths to skip decryption
            const excludedRoutes = [
                // '/',
               '/api/webhooks/zoom-webhook'
            ];
            if (excludedRoutes.some(route => req.path.startsWith(route))) {
                console.log("skipping decryption")
                next();
               
            } else if (req.headers.api_key === process.env.FLUTTER_API_KEY) {
            } else {
                if (req.body) {
                    try {
                        const decrypted = decrypt(req.body.encryptedBody);
                        req.body = JSON.parse(decrypted);
                    } catch (error) {
                        console.log("error", error);
                        return res.status(400).send('Decryption failed');
                    }
                }
            }
            next();
        },
        encryptResponseBody: (req, res, next) => {
            const oldJson = res.json;
            console.log("encrypting",req.path)
            res.json = async (body) => {
                 // add paths to skip encryption
                const excludedRoutes = [
                   '/api/webhooks/zoom-webhook'
                ];
                console.log(req.path)
                if (excludedRoutes.some(route => req.path.startsWith(route))) {
                    return oldJson.call(res,  body )
                } else if (req.headers.api_key === process.env.FLUTTER_API_KEY) {
                    return oldJson.call(res, { body })
                } else {
                    const encryptedBody = encrypt(JSON.stringify(body));
                    return oldJson.call(res, { encryptedBody, dataEncrypted: 'true' });
                }
            };
            next();
        }
    };
};