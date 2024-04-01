const express = require("express");
const asyncHandler = require("express-async-handler");
const { registerUser, loginUser, logoutUser, updateUserInfo, listUsers, loginStatus, markAllNotificationsAsSeen } = require("../controllers/userController");
const isAuthenticated = require("../middlewares/authMiddleware");


const router = express.Router();

// Register User
router.post("/register",isAuthenticated, asyncHandler(registerUser));

// Login User
router.post("/login", asyncHandler(loginUser));

// Logout User
router.get("/logout", isAuthenticated, asyncHandler(logoutUser));

// Update User Info
router.put("/update/:userId", isAuthenticated, asyncHandler(updateUserInfo));

// List Users
router.get("/list", isAuthenticated, asyncHandler(listUsers));

// Login Status
router.get("/login-status", asyncHandler(loginStatus));

router.get('/seen',isAuthenticated, markAllNotificationsAsSeen )


module.exports = router;
