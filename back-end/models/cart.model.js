const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Nếu có model Product
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Nếu có model User
    required: true,
    unique: true // 1 user chỉ có 1 cart
  },
  items: {
    type: [cartItemSchema],
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Cập nhật updatedAt tự động khi có thay đổi
cartSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
