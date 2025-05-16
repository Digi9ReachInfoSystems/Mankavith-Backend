module.exports = (encrypt, decrypt) => {
    return {
        decryptRequestBody: (req, res, next) => {
            // add paths to skip decryption
            const excludedRoutes = [
                // '/',
            ];
            if (excludedRoutes.some(route => req.path.startsWith(route))) {
               
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
            res.json = async (body) => {
                 // add paths to skip encryption
                const excludedRoutes = [
                    // '/',
                ];
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