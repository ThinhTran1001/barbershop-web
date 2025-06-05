const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackProduct.controller');

// Tạo đánh giá
router.post('/', feedbackController.createFeedback);
// Lấy feedback theo productId
router.get('/product/:productId', feedbackController.getFeedbacksByProduct);
// Lấy toàn bộ feedback (admin)
router.get('/', feedbackController.getAllFeedbacks);
// Duyệt feedback (admin)
router.patch('/approve/:id', feedbackController.approveFeedback);
// Xóa feedback (admin)
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;