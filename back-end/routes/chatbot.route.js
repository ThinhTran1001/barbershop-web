// routes/chatbot.route.js
const express = require('express');
const router  = express.Router();
const { handleChatbot } = require('../controllers/chatbot.controller');

router.post('/', handleChatbot);

module.exports = router;
