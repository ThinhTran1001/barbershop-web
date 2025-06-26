const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  method: {
    type: String,
    enum: ['payOS', 'cash'],
    required: true
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    required: true
  },
  transactionId: {
    type: String,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true 
});

paymentSchema.index({ orderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
