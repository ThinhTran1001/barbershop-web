const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/payos.controller');

// PayOS webhook
router.post('/webhook', handleWebhook);

module.exports = router;
