const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/cash/:orderId', paymentController.createCashPayment);
router.post('/unpaid/:orderId', paymentController.createUnpaidPayment);       
router.put('/status/:transactionId', paymentController.updatePaymentStatus);
router.put('/order/:orderId', paymentController.updatePaymentByOrderId);

router.put('/mark-paid/:orderId', authenticate, paymentController.markPaymentAsPaidByOrderId);

module.exports = router;