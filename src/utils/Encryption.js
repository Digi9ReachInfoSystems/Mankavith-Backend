const crypto = require('crypto');

module.exports = (key) => {
    const algorithm = 'aes-256-cbc';

    return {
        encrypt: (text) => {

            const iv = crypto.randomBytes(16)

            const cipher = crypto.createCipheriv(algorithm, process.env.CRYPTION_KEY, iv)

            const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
            //  console.log("encrypted", encrypted.toString('hex'));
            return {
                iv: iv.toString('hex'),
                content: encrypted.toString('hex')
            }

            //   const iv = crypto.randomBytes(16);
            //   const iv2 = crypto.randomBytes(32);
            //   const key2 = Buffer.from(key, 'utf-8');
            //   console.log("text",text,"key",key,"iv",iv,"key2",key2);
            //   const cipher = crypto.createCipheriv(algorithm, iv2, iv);
            // //   console.log("cipher",cipher);
            //   let encrypted = cipher.update(text);
            //   encrypted = Buffer.concat([encrypted, cipher.final()]);
            //   return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
        },

        decrypt: (text) => {
            const iv = Buffer.from(text.iv, 'hex');
            const encryptedText = Buffer.from(text.content, 'hex');
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        }
    };
};