const express = require("express")
const isAuthenticated = require("../middlewares/authMiddleware")
const { sendMessages } = require("../controllers/MessagesController")

const router = express.Router()



router.post("/send",isAuthenticated, sendMessages)


module.exports = router