const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { sendMessage, getMyMessages } = require('../controllers/chatController');
const { getConversations, getMessagesWith } = require('../controllers/conversationController');

// Send message
router.post('/', protect, sendMessage);

// Get all my messages
router.get('/', protect, getMyMessages);

// Conversation list
router.get('/conversations', protect, getConversations);

// Messages with specific user
router.get('/with/:id', protect, getMessagesWith);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Chat route working!' });
});

module.exports = router;
