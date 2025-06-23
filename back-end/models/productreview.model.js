const mongoose = require('mongoose');

const ProductReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: false },
  images: [{ type: String }],
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProductReview', ProductReviewSchema);
