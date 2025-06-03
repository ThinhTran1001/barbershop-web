const mongoose = require('mongoose');

const productReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  customerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Customer' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Tham chiếu đến đơn hàng (nếu có)
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  images: [{ type: String }], // Hình ảnh đánh giá sản phẩm
  pros: { type: String }, // Ưu điểm của sản phẩm
  cons: { type: String }, // Nhược điểm của sản phẩm
  isVerifiedPurchase: { type: Boolean, default: false }, // Xác nhận đã mua sản phẩm
  isApproved: { type: Boolean, default: false },
  helpfulCount: { type: Number, default: 0 }, // Số lượng người thấy review hữu ích
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index để tối ưu hóa truy vấn
productReviewSchema.index({ productId: 1, rating: -1 });
productReviewSchema.index({ customerId: 1, createdAt: -1 });

const ProductReview = mongoose.model('ProductReview', productReviewSchema);

module.exports = ProductReview;