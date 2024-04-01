const crypto = require("crypto");

const encryptionKey = process.env.ENCRYPTION_KEY; // Should be 256 bits (32 characters)
const algorithm = "aes-256-cbc";
const ivLength = 16;

function decryptData(data) {
	const iv = Buffer.from(data.slice(0, ivLength * 2), "hex");
	const encryptedData = data.slice(ivLength * 2);
	const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey), iv);
	let decrypted = decipher.update(encryptedData, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

module.exports = decryptData;
