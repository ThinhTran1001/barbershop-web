const mongoose = require('mongoose');

const ProductReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating: { 
    type: Number, 
  }, 
  comment: { type: String, required: false },
  images: [{ type: String }],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProductReview', ProductReviewSchema);