const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');

router.post('/',voucherController.createVoucher)
router.get('/',voucherController.getAllVoucher)
router.get('/:id',voucherController.getSingerVoucher)
router.put('/:id',voucherController.updateVoucher)
router.delete('/:id',voucherController.deleteVoucher)

module.exports = router;