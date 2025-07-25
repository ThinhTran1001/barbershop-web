const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/', authenticate, voucherController.createVoucher)
router.get('/', authenticate, voucherController.getAllVoucher)
router.get('/user', authenticate, voucherController.getAllVoucherByUser)
router.get('/personal', authenticate, voucherController.getPersonalVouchers);
router.get('/public', voucherController.getPublicVouchers);
router.get('/:id', voucherController.getSingerVoucher)
router.put('/:id', authenticate, voucherController.updateVoucher)
router.delete('/:id', authenticate, voucherController.deleteVoucher)
// router.post('/', voucherController.createVoucher)
// router.get('/', voucherController.getAllVoucher)
// router.get('/user', voucherController.getAllVoucherByUser)
// router.get('/:id',  voucherController.getSingerVoucher)
// router.put('/:id', voucherController.updateVoucher)
// router.delete('/:id',voucherController.deleteVoucher)

module.exports = router;