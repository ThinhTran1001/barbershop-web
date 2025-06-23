const Payment = require('../models/payment.model');

exports.createCashPayment = async (orderId) => {
  try {
    const payment = await Payment.create({
      orderId,
      method: 'cash',
      status: 'unpaid',
      paidAt: new Date()
    });
    return payment;
  } catch (error) {
    throw new Error('Failed to create cash payment: ' + error.message);
  }
};

exports.createUnpaidPayment = async (orderId, method) => {
  try {
    const payment = await Payment.create({
      orderId,
      method,
      status: 'unpaid'
    });
    return payment;
  } catch (error) {
    throw new Error('Failed to create unpaid payment: ' + error.message);
  }
};

exports.updatePaymentStatus = async (transactionId, status, paidAt = new Date()) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { transactionId },
      {
        status,
        paidAt
      },
      { new: true }
    );
    return payment;
  } catch (error) {
    throw new Error('Failed to update payment status: ' + error.message);
  }
};

exports.updatePaymentByOrderId = async (orderId, status, paidAt = null) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { orderId },
      {
        status,
        paidAt
      },
      { new: true }
    );
    return payment;
  } catch (error) {
    throw new Error('Failed to update payment by orderId: ' + error.message);
  }
};

exports.getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
