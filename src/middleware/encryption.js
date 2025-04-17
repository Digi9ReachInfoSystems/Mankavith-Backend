module.exports = (encrypt, decrypt) => {
    return {
        decryptRequestBody: (req, res, next) => {
            if (req.headers.api_key === process.env.FLUTTER_API_KEY) {
            } else {
                try {
                    const decrypted = decrypt(req.body.encryptedBody);
                    req.body = JSON.parse(decrypted);
                } catch (error) {
                    return res.status(400).send('Decryption failed');
                }
            }
            next();
        },
        encryptResponseBody: (req, res, next) => {
            const oldJson = res.json;
            res.json = async (body) => {

                if (req.headers.api_key === process.env.FLUTTER_API_KEY) {
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