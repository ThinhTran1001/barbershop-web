const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  discount: {
    type: Number,
    required: true
  },
  discountEndDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

DiscountSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Discount', DiscountSchema);
