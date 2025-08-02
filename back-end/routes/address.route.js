const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Tất cả routes đều cần authentication
router.use(authenticate);

// Lấy tất cả địa chỉ của user
router.get('/', addressController.getUserAddresses);

// Lấy địa chỉ mặc định
router.get('/default', addressController.getDefaultAddress);

// Tạo địa chỉ mới
router.post('/', addressController.createAddress);

// Cập nhật địa chỉ
router.put('/:id', addressController.updateAddress);

// Xóa địa chỉ (soft delete)
router.delete('/:id', addressController.deleteAddress);

// Set địa chỉ làm mặc định
router.patch('/:id/set-default', addressController.setDefaultAddress);

module.exports = router; 