const crypto = require("crypto")

function encrypt(text) {
    const algorithm = "aes-256-ctr";
    const secret = process.env.ENCRYPTION_KEY;
    const secretKey = crypto.createHash('sha256').update(secret).digest();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
    const algorithm = "aes-256-ctr";
    const secret = process.env.ENCRYPTION_KEY;
    const secretKey = crypto.createHash('sha256').update(secret).digest();
    const [iv, encryptedText] = text.split(":").map((part) => Buffer.from(part, "hex"));

    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
}



module.exports = {encrypt, decrypt}
