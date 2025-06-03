const express = require('express');
const router = express.Router();
const productReviewController = require('../controllers/feedbackProduct.controller');
// Import middleware xác thực nếu cần
// const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

// POST /api/product-reviews - Tạo đánh giá sản phẩm mới
router.post('/', productReviewController.createProductReview);

// GET /api/product-reviews - Lấy tất cả đánh giá sản phẩm (có phân trang và filter)
router.get('/', productReviewController.getAllProductReviews);

// GET /api/product-reviews/product/:productId - Lấy đánh giá theo sản phẩm
router.get('/product/:productId', productReviewController.getReviewsByProduct);

// GET /api/product-reviews/customer/:customerId - Lấy đánh giá theo khách hàng
router.get('/customer/:customerId', productReviewController.getReviewsByCustomer);

// PUT /api/product-reviews/:id/approve - Duyệt đánh giá sản phẩm (chỉ admin)
// router.put('/:id/approve', authenticateToken, isAdmin, productReviewController.approveProductReview);
router.put('/:id/approve', productReviewController.approveProductReview);

// PUT /api/product-reviews/:id - Cập nhật đánh giá sản phẩm
router.put('/:id', productReviewController.updateProductReview);

// PUT /api/product-reviews/:id/helpful - Đánh dấu review hữu ích
router.put('/:id/helpful', productReviewController.markReviewHelpful);

// DELETE /api/product-reviews/:id - Xóa đánh giá sản phẩm
router.delete('/:id', productReviewController.deleteProductReview);

module.exports = router;
