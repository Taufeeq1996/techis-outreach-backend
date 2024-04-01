const express = require("express");
const router = express.Router();

const KixieCredentialsController = require("../controllers/KixieCredentialsController");
const authMiddleware = require("../middlewares/authMiddleware"); // Your JWT authentication middleware

// Routes for KixieCredentials

// Route to add a new KixieCredential
router.post("/add", authMiddleware, KixieCredentialsController.addKixieCredentials);

// Route to edit a KixieCredential
router.patch("/edit/:id", authMiddleware, KixieCredentialsController.editKixieCredentials);

// Route to list all KixieCredentials
router.get("/list", authMiddleware, KixieCredentialsController.listKixieCredentials);

// Route to list all Kixie names
router.get("/names", authMiddleware, KixieCredentialsController.listKixieNames);

module.exports = router;
