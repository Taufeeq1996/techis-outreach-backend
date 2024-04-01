const express = require('express');
const { emailTracking } = require('../controllers/trackingController');

const router = express.Router()


router.get("/", emailTracking)

module.exports = router