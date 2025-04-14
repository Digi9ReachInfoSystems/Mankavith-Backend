const crypto = require('crypto');

module.exports = (key) => {
    const algorithm = 'aes-256-cbc';
    
    return {
        encrypt: (text) => {
            const Key = process.env.CRYPTION_KEY;
            const iv = crypto.randomBytes(16)

            const cipher = crypto.createCipheriv(algorithm, Key, iv)

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
            try{
                const Key = process.env.CRYPTION_KEY;
            console.log("key", Key);
            const iv = Buffer.from(text.iv, 'hex');
            const encryptedText = Buffer.from(text.content, 'hex');
            console.log("encryptedText", encryptedText);
            console.log("1) About to create decipher");
            const decipher = crypto.createDecipheriv(algorithm, Key, iv);
            console.log("2) Decipher created");
            let decrypted = decipher.update(encryptedText);
            console.log("3) After decipher.update()", decrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            console.log("4) After decipher.final()", decrypted);

            console.log("5) Decrypted text:", decrypted.toString());
            return decrypted.toString();
            }catch(error){
                console.log("error", error);
                return null;
            }
            
        }
    };
};