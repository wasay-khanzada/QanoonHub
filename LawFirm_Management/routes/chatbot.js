// routes/chatbot.js
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Send message to chatbot
router.post('/message', chatbotController.sendMessage);

// Get conversation history
router.get('/history/:sessionId', chatbotController.getHistory);

// Clear conversation history
router.delete('/history/:sessionId', chatbotController.clearHistory);

module.exports = router;
