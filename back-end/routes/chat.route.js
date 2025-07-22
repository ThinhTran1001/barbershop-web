// back-end/routes/chat.route.js
const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/chatMessage.model');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

router.get('/messages', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const roomId = req.query.roomId || userId;

    const messages = await ChatMessage.find({
      roomId: roomId.toString()
    }).sort({ timestamp: 1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
});

router.get('/rooms', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const rooms = await ChatMessage.distinct('roomId');
    res.json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching rooms', error: err.message });
  }
});

module.exports = router;