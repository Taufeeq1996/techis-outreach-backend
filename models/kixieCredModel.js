require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");

const encryptionKey = process.env.ENCRYPTION_KEY; // Should be 256 bits (32 characters)
const algorithm = "aes-256-cbc"; // The encryption algorithm
const ivLength = 16; // IV length

const KixieCredentialsSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: [true, "User ID (foreign key) is required"],
	},
	type:{
		type: String,
		enum: ["global", "personal"],
		default: "personal",
	},
	kixieUserId: {
		type: String,
		required: [true, "User ID (string) is required"],
		minlength: [1, "Minimum User ID (string) length is 1 character"],
		maxlength: [50, "Maximum User ID (string) length is 50 characters"],
	},
	name: {
		type: String,
		required: [true, "Name is required"],
		minlength: [1, "Minimum name length is 1 character"],
		maxlength: [50, "Maximum name length is 50 characters"],
	},
	phone: {
		type: Number,
		required: [true, "Phone number required"],
		minlength: [10, "Minimum API Key length is 20 characters"],
		maxlength: [11, "Maximum API Key length is 128 characters"],
	},
	apiKey: {
		type: String,
		required: [true, "API Key is required"],
		minlength: [20, "Minimum API Key length is 20 characters"],
		maxlength: [128, "Maximum API Key length is 128 characters"],
	},
	status: {
		type: String,
		enum: ["active", "inactive"],
		default: "active",
	},
	businessId: {
		type: String,
		required: [true, "Business ID is required"],
		minlength: [1, "Minimum Business ID length is 1 character"],
		maxlength: [50, "Maximum Business ID length is 50 characters"],
	},
});

KixieCredentialsSchema.pre("save", function (next) {
	const iv = crypto.randomBytes(ivLength);
	const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey), iv);
	let encrypted = cipher.update(this.apiKey, "utf8", "hex");
	encrypted += cipher.final("hex");
	this.apiKey = iv.toString("hex") + encrypted;

	next();
});

KixieCredentialsSchema.post("find", function (docs) {
	docs.forEach((doc) => {
		if (doc.apiKey) {
			const iv = Buffer.from(doc.apiKey.slice(0, ivLength * 2), "hex");
			const encryptedData = doc.apiKey.slice(ivLength * 2);
			const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey), iv);
			let decrypted = decipher.update(encryptedData, "hex", "utf8");
			decrypted += decipher.final("utf8");
			doc.apiKey = decrypted;
		} 
	});
});


const KixieCredentials = mongoose.model("KixieCredentials", KixieCredentialsSchema);

module.exports = KixieCredentials;
