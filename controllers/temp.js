
// Import required modules
const crypto = require("crypto");
const axios = require("axios");
const FormData = require("form-data");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

// Import your models
const KixieCredentials = require("../models/kixieCredModel");
const KixieTemplate = require("../models/kixieTemplateModel");
const GmailCredentials = require("../models/gmailCredModel");
const GmailTemplate = require("../models/gmailTemplateModel");
const EmailBatch = require("../models/emailModel");

// Controller function
const sendMessages = asyncHandler(async (req, res) => {
    const {
        userId,
        body: { actionType, actionData, tableData },
    } = req;

    const { emailCredId, emailTemplateId, kixieCredId, kixieTemplateId } =
        actionData;
    if (actionType === "email") {
        if (!emailCredId || !emailTemplateId) {
            throw new Error("Missing required email actionData fields");
        }
    } else if (actionType === "sms") {
        if (!kixieCredId || !kixieTemplateId) {
            throw new Error("Missing required SMS actionData fields");
        }
    } else if (actionType === "both") {
        if (
            !emailCredId ||
            !emailTemplateId ||
            !kixieCredId ||
            !kixieTemplateId
        ) {
            throw new Error(
                "Missing required actionData fields for both email and SMS"
            );
        }
    } else {
        throw new Error("Invalid actionType provided");
    }

    // Generate batchId
    const batchTime = new Date().toISOString();
    const batchId = crypto
        .createHash("sha256")
        .update(`${userId}-${batchTime}`)
        .digest("hex");

    const newBatch = new EmailBatch({
        _id: batchId,
        userId,
        timestamp: batchTime,
        emailCount: tableData.length,
    });

    const savedBatch = await newBatch.save();
    if (!savedBatch) {
        throw new Error("Failed to save email batch");
    }

    let smsSummary = [];
    let emailSummary = [];

    const encryptionKey = process.env.ENCRYPTION_KEY; // Should be 256 bits (32 characters)
    const algorithm = "aes-256-cbc"; // The encryption algorithm
    const ivLength = 16; // IV length

    if (actionType === "sms" || actionType === "both") {
        const kixieCredentials = await KixieCredentials.findById(kixieCredId);
  
        if (!kixieCredentials) {
            throw new Error("Kixie Credentials not found");
        }
        if (kixieCredentials) {

            if (kixieCredentials.apiKey) {
                const iv = Buffer.from(
                    kixieCredentials.apiKey.slice(0, ivLength * 2),
                    "hex"
                );
                const encryptedData = kixieCredentials.apiKey.slice(
                    ivLength * 2
                );
                const decipher = crypto.createDecipheriv(
                    algorithm,
                    Buffer.from(encryptionKey),
                    iv
                );
                let decrypted = decipher.update(encryptedData, "hex", "utf8");
                decrypted += decipher.final("utf8");
                kixieCredentials.apiKey = decrypted;
            }
        }

        const kixieTemplate = await KixieTemplate.findById(kixieTemplateId);

        if (!kixieTemplate) {
            throw new Error("Kixie Template not found");
        }

        const smsPromises = tableData.map(async ({ Name, Phone }) => {
            const form = new FormData();
            const formData = {
                call: "sendsms",
                businessid: kixieCredentials.businessId,
                userid: kixieCredentials.kixieUserId,
                apiKey: kixieCredentials.apiKey,
            };

            Object.keys(formData).forEach((key) => {
                form.append(key, formData[key]);
            });

            const personalizedMessage = kixieTemplate.content.replace(
                /\$\{name\}/g,
                Name
            );
            form.append("number", `+1${Phone}`);
            form.append("message", personalizedMessage);


            try {
                const res = await axios.post(
                    "https://apig.kixie.com/itn/sendmms",
                    form,
                    { headers: { ...form.getHeaders() } }
                );

                return res;
            } catch (error) {
                console.error("Error:", error); // Log the error message
                throw new Error(error); // Re-throw the error to handle it at a higher level if needed
            }
        });

        const smsResults = await Promise.allSettled(smsPromises);

        // Update SMS summary based on the outcomes
        smsResults.forEach((result, index) => {
            const { Name, Phone } = tableData[index];
            if (result.status === "fulfilled") {
                smsSummary.push({ Name, Phone, status: "Success" });
            } else {
                smsSummary.push({
                    Name,
                    Phone,
                    status: "Failed",
                    reason: result.reason,
                });
            }
        });
    }

    if (actionType === "email" || actionType === "both") {
        const gmailCredentials = await GmailCredentials.findById(emailCredId);

        if (!gmailCredentials) {
            throw new Error("Gmail Credentials not found");
        }

        if (gmailCredentials) {
            if (
                gmailCredentials.oauthClientSecret &&
                gmailCredentials.oauthRefreshToken
            ) {
                // Decrypt oauthClientSecret
                const iv = Buffer.from(
                    gmailCredentials.oauthClientSecret.slice(0, ivLength * 2),
                    "hex"
                );
                const encryptedData = gmailCredentials.oauthClientSecret.slice(
                    ivLength * 2
                );
                const decipher = crypto.createDecipheriv(
                    algorithm,
                    Buffer.from(encryptionKey),
                    iv
                );
                let decrypted = decipher.update(encryptedData, "hex", "utf8");
                decrypted += decipher.final("utf8");
                gmailCredentials.oauthClientSecret = decrypted;

                // Decrypt oauthRefreshToken
                const ivRefresh = Buffer.from(
                    gmailCredentials.oauthRefreshToken.slice(0, ivLength * 2),
                    "hex"
                );
                const encryptedDataRefresh =
                    gmailCredentials.oauthRefreshToken.slice(ivLength * 2);
                const decipherRefresh = crypto.createDecipheriv(
                    algorithm,
                    Buffer.from(encryptionKey),
                    ivRefresh
                );
                let decryptedRefresh = decipherRefresh.update(
                    encryptedDataRefresh,
                    "hex",
                    "utf8"
                );
                decryptedRefresh += decipherRefresh.final("utf8");
                gmailCredentials.oauthRefreshToken = decryptedRefresh;
            }
        }

        const gmailTemplate = await GmailTemplate.findById(emailTemplateId);
        if (!gmailTemplate) {
            throw new Error("Gmail Template not found");
        }

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: gmailCredentials.email,
                clientId: gmailCredentials.oauthClientId,
                clientSecret: gmailCredentials.oauthClientSecret,
                refreshToken: gmailCredentials.oauthRefreshToken,
            },
        });

        const emailPromises = tableData.map(async ({ Name, Email }) => {
            const trackingId = crypto
                .createHash("sha256")
                .update(`${batchId}-${Email}`)
                .digest("hex");
            const trackingPixel = `<img src="http://localhost:8000/api/track?trackingId=${trackingId}" width="1" height="1" alt="" crossorigin="anonymous"/>`;
            const personalizedHtml = gmailTemplate.html.replace(/\$\{name\}/g, Name) +
                    trackingPixel;
					// console.log(personalizedHtml)

            const mailOptions = {
                from: gmailCredentials.email,
                to: Email,
                subject: "Your Subject Here",
                html: personalizedHtml,
            };

            return transporter.sendMail(mailOptions);
        });

        const emailResults = await Promise.allSettled(emailPromises);

        // Update email summary based on the outcomes
        emailResults.forEach((result, index) => {
            const { Name, Email } = tableData[index];
            if (result.status === "fulfilled") {
                emailSummary.push({ Name, Email, status: "Success" });
            } else {
                emailSummary.push({
                    Name,
                    Email,
                    status: "Failed",
                    reason: result.reason,
                });
            }
        });
    }
    const summary = {
        batchId,
        smsSummary,
        emailSummary,
    };

    // Send the summary report to the frontend
    res.status(200).json(summary);
});

module.exports = { sendMessages };