// models/feedbackOrder.model.js
const mongoose = require('mongoose');

const feedbackOrderSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const FeedbackOrder = mongoose.model('FeedbackOrder', feedbackOrderSchema);
module.exports = FeedbackOrder;