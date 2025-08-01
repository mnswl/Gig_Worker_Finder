const express = require('express');
const router = express.Router();

const { aiChat } = require('../controllers/aiController');

// anonymous access – no auth required for help bot, but you may add rate-limit middleware later
router.post('/chat', aiChat);

module.exports = router;
