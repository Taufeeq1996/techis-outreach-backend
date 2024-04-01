const express = require("express");
const router = express.Router();

const GmailCredentialsController = require("../controllers/GmailCredentialsController");
const authMiddleware = require("../middlewares/authMiddleware"); // Your JWT authentication middleware

router.post("/add", authMiddleware, GmailCredentialsController.addGmailCredentials);
router.patch("/edit/:id", authMiddleware, GmailCredentialsController.editGmailCredentials);
router.get("/list", authMiddleware, GmailCredentialsController.listGmailCredentials);
router.get("/emails", authMiddleware, GmailCredentialsController.listGmailEmails);

module.exports = router;
