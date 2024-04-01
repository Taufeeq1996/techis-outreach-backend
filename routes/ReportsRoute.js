const express = require("express")
const isAuthenticated = require("../middlewares/authMiddleware")
const { getEmailData, getSMSData } = require("../controllers/reportsController")

const router = express.Router()


router.get("/email", isAuthenticated, getEmailData)
router.get("/sms", isAuthenticated, getSMSData)




module.exports = router