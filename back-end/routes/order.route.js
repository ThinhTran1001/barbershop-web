const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Tạo đơn hàng
router.post('/', authenticate, orderController.createOrder);

router.post('/guest', orderController.createOrderGuest);

router.get('/', authenticate, orderController.getAllOrders);

router.get('/:id', authenticate, orderController.getSingleOrder);

// Cập nhật trạng thái đơn hàng (chỉ sửa status)
router.put('/:id', authenticate, orderController.updateOrder);

// Xoá đơn hàng
router.delete('/:id', authenticate, orderController.deleteOrder);

router.get('/code/:code', authenticate, orderController.getOrderByCode);

router.post('/finalize-auth', orderController.finalizeOrderAuth);

router.post('/finalize-guest', orderController.finalizeOrderGuest);

// Kiểm tra tồn kho trước khi checkout
router.post('/pre-checkout-validation', orderController.preCheckoutStockValidation);

module.exports = router;
