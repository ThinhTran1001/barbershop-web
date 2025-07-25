const Payment = require('../models/payment.model');
const Order = require('../models/order.model');
const PaymentController = require('./payment.controller');

exports.handleWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const { orderCode, status, transactionId, paidAt } = payload;

    const order = await Order.findOne({ orderCode: `ORD-${orderCode}` });
    if (!order) return res.status(404).send('Order not found');

    if (status === 'PAID') {
      await PaymentController.updatePaymentByOrderId(order._id, 'paid', new Date(paidAt));
      order.status = 'processing';
      await order.save();
    } else if (status === 'CANCELLED') {
      await PaymentController.updatePaymentByOrderId(order._id, 'refunded', null);
      order.status = 'cancelled';
      await order.save();
    }

    return res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('PayOS webhook error:', error);
    return res.status(500).send('Internal error');
  }
};
