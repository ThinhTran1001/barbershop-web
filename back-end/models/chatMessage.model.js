const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  senderRole: { type: String, enum: ['user', 'admin'], required: true },
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);