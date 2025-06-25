const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  
  },
  customerName: {
    type: String,
    required: function() {
      return !this.userId; 
    }
  },
  customerEmail: {
    type: String,
    required: function() {
      return !this.userId;
    }
  },
  customerPhone: {
    type: String,
    required: function() {
      return !this.userId;
    }
  },
  shippingAddress: {
    type: String,
    required: true
  },
  orderCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  addressChanged: {
    type: Boolean,
    default: false
  }
});

orderSchema.index({ userId: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
