const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/', authenticate, voucherController.createVoucher)
router.get('/', authenticate, voucherController.getAllVoucher)
router.get('/user', authenticate, voucherController.getAllVoucherByUser)
router.get('/:id', authenticate, voucherController.getSingerVoucher)
router.put('/:id', authenticate, voucherController.updateVoucher)
router.delete('/:id', authenticate, voucherController.deleteVoucher)

module.exports = router;