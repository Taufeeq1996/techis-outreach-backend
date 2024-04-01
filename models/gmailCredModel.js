require("dotenv").config();
const mongoose = require("mongoose");
const { isEmail } = require("validator");
const crypto = require("crypto");

const encryptionKey = process.env.ENCRYPTION_KEY; // Should be 256 bits (32 characters)
const algorithm = "aes-256-cbc"; // The encryption algorithm
const ivLength = 16; // IV length

const GmailCredentialsSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: [true, "User ID is required"],
	},
	status: {
		type: String,
		enum: ["active", "inactive"],
		default: "active",
	},
	type:{
		type:String,
		enum:["global", "personal"],
		default:"personal"
	},
	email: {
		type: String,
		required: [true, "Email is required"],
		validate: [isEmail, "Invalid email"],
		minlength: [6, "Minimum email length is 6 characters"],
		maxlength: [128, "Maximum email length is 128 characters"],
	},
	oauthClientId: {
		type: String,
		required: [true, "OAuth Client ID is required"],
		minlength: [5, "Minimum OAuth Client ID length is 5 characters"],
		maxlength: [128, "Maximum OAuth Client ID length is 128 characters"],
	},
	oauthClientSecret: {
		type: String,
		required: [true, "OAuth Client Secret is required"],
		minlength: [8, "Minimum OAuth Client Secret length is 8 characters"],
		maxlength: [128, "Maximum OAuth Client Secret length is 128 characters"],
	},
	oauthRefreshToken: {
		type: String,
		required: [true, "OAuth Refresh Token is required"],
		minlength: [8, "Minimum OAuth Refresh Token length is 8 characters"],
		maxlength: [128, "Maximum OAuth Refresh Token length is 128 characters"],
	},
});

GmailCredentialsSchema.pre("save", function (next) {
	const iv = crypto.randomBytes(ivLength);
	const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey), iv);
	let encrypted = cipher.update(this.oauthClientSecret, "utf8", "hex");
	encrypted += cipher.final("hex");
	this.oauthClientSecret = iv.toString("hex") + encrypted;

	// Repeat for oauthRefreshToken
	const ivRefresh = crypto.randomBytes(ivLength);
	const cipherRefresh = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey), ivRefresh);
	let encryptedRefresh = cipherRefresh.update(this.oauthRefreshToken, "utf8", "hex");
	encryptedRefresh += cipherRefresh.final("hex");
	this.oauthRefreshToken = ivRefresh.toString("hex") + encryptedRefresh;

	next();
});

GmailCredentialsSchema.post("find", function (docs) {
	docs.forEach((doc) => {
		if (doc.oauthClientSecret && doc.oauthRefreshToken) {
			// Decrypt oauthClientSecret
			const iv = Buffer.from(doc.oauthClientSecret.slice(0, ivLength * 2), "hex");
			const encryptedData = doc.oauthClientSecret.slice(ivLength * 2);
			const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey), iv);
			let decrypted = decipher.update(encryptedData, "hex", "utf8");
			decrypted += decipher.final("utf8");
			doc.oauthClientSecret = decrypted;

			// Decrypt oauthRefreshToken
			const ivRefresh = Buffer.from(doc.oauthRefreshToken.slice(0, ivLength * 2), "hex");
			const encryptedDataRefresh = doc.oauthRefreshToken.slice(ivLength * 2);
			const decipherRefresh = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey), ivRefresh);
			let decryptedRefresh = decipherRefresh.update(encryptedDataRefresh, "hex", "utf8");
			decryptedRefresh += decipherRefresh.final("utf8");
			doc.oauthRefreshToken = decryptedRefresh;
		}
	});
});

const GmailCredentials = mongoose.model("GmailCredentials", GmailCredentialsSchema);

module.exports = GmailCredentials;
