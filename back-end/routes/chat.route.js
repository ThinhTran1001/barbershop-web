const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/chatMessage.model');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const mongoose = require('mongoose');
const User = require('../models/user.model');

router.get('/messages', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const roomId = req.query.roomId || userId;

    const messages = await ChatMessage.find({
      roomId: roomId.toString()
    })
    .sort({ timestamp: 1 })
    .populate('senderId', 'name'); // ✅ lấy tên người gửi

    // Trả về dạng { text, senderId, senderName, timestamp }
    const transformed = messages.map(msg => ({
      ...msg.toObject(),
      senderName: msg.senderId?.name || 'Unknown',
      senderId: msg.senderId?._id,
    }));

    res.json({ success: true, data: transformed });
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

router.get('/rooms-detail', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const roomIds = await ChatMessage.distinct('roomId');

    // Chuyển tất cả roomId (string) sang ObjectId an toàn
    const objectIds = roomIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    // Truy vấn user với ObjectId
    const users = await User.find({ _id: { $in: objectIds } }).select('_id name avatarUrl');

    // Map kết quả trả về
    const result = roomIds.map(roomId => {
      const matchUser = users.find(u => u._id.toString() === roomId);
      return {
        roomId,
        user: matchUser || null
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[ROOMS-DETAIL ERROR]', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});


module.exports = router;