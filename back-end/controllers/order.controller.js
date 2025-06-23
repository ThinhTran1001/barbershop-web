const Order = require('../models/order.model');
const Order_Item = require('../models/order_item.model');
const Product = require('../models/product.model');
const Voucher = require('../models/voucher.model');
const Payment = require('../models/payment.model');
const PaymentController = require('./payment.controller');
const User_Voucher = require('../models/user_voucher.model');

// Helper function để kiểm tra quyền sử dụng voucher
const validateVoucherUsage = async (userId, voucherId) => {
  const voucher = await Voucher.findById(voucherId);
  if (!voucher || !voucher.isActive) {
    return { isValid: false, message: 'Voucher không hợp lệ hoặc đã hết hạn' };
  }

  const now = new Date();
  if (voucher.startDate && now < new Date(voucher.startDate)) {
    return { isValid: false, message: 'Voucher chưa được áp dụng' };
  }

  if (voucher.endDate && now > new Date(voucher.endDate)) {
    return { isValid: false, message: 'Voucher đã hết hạn' };
  }

  if (voucher.usageLimit !== undefined && voucher.usedCount >= voucher.usageLimit) {
    return { isValid: false, message: 'Voucher đã được sử dụng hết' };
  }

  // Kiểm tra xem người dùng có quyền sử dụng voucher này không
  const userVoucher = await User_Voucher.findOne({ 
    userId: userId, 
    voucherId: voucherId, 
    isUsed: false 
  });

  if (!userVoucher) {
    return { isValid: false, message: 'Voucher không khả dụng cho tài khoản này' };
  }

  return { isValid: true, voucher, userVoucher };
};

exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, items, voucherId, paymentMethod } = req.body;

    const order = new Order({
      userId: req.user.id,
      orderCode: `ORD-${Date.now()}`,
      status: 'pending',
      shippingAddress,
      voucherId: voucherId || null,
    });

    let originalTotal = 0;
    let discountAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: 'Sản phẩm không hợp lệ' });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Sản phẩm ${product.name} không đủ hàng trong kho` });
      }

      product.stock -= item.quantity;
      await product.save();

      const unitPrice = product.price;
      const subtotal = unitPrice * item.quantity;
      originalTotal += subtotal;

      orderItems.push({
        orderId: order._id,
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        productImage: product.image 
      });
    }

    if (voucherId) {
      const { isValid, message, voucher, userVoucher } = await validateVoucherUsage(req.user.id, voucherId);
      if (!isValid) {
        return res.status(400).json({ message });
      }

      if (voucher.minOrderAmount && originalTotal < voucher.minOrderAmount) {
        return res.status(400).json({
          message: `Đơn hàng cần tối thiểu ${voucher.minOrderAmount} để áp dụng voucher`,
        });
      }

      const value = parseFloat(voucher.value);
      if (isNaN(value)) {
        return res.status(400).json({ message: 'Giá trị voucher không hợp lệ' });
      }

      if (voucher.type === 'percent') {
        discountAmount = originalTotal * (value / 100);
      } else if (voucher.type === 'fixed') {
        discountAmount = value;
      }

      if (discountAmount > originalTotal) discountAmount = originalTotal;
    }

    const finalTotal = originalTotal - discountAmount;

    order.totalAmount = Number(finalTotal.toFixed(2));
    order.discountAmount = Number(discountAmount.toFixed(2));

    const savedOrder = await order.save();
    await Order_Item.insertMany(orderItems);

    // Cập nhật trạng thái voucher sau khi đơn hàng đã được tạo
    if (voucherId) {
        // 1. Luôn tăng lượt sử dụng của voucher gốc
        const updatedVoucher = await Voucher.findByIdAndUpdate(voucherId, { $inc: { usedCount: 1 } }, { new: true });

        // 2. Vô hiệu hóa voucher gốc nếu đạt đến giới hạn
        if (updatedVoucher.usageLimit !== undefined && updatedVoucher.usedCount >= updatedVoucher.usageLimit) {
            updatedVoucher.isActive = false;
            await updatedVoucher.save();
        }

        // 3. Đánh dấu voucher cá nhân là đã sử dụng
        await User_Voucher.findOneAndUpdate(
            { userId: req.user.id, voucherId: voucherId, isUsed: false },
            { isUsed: true }
        );
    }

    await PaymentController.createUnpaidPayment(
      savedOrder._id, 
      paymentMethod || 'cash'
    );

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: savedOrder,
    });
  } catch (error) {
    console.error('Lỗi tạo đơn hàng:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getAllOrders = async (req, res) => {
  try {
    const filters = {};
    const { status, fromDate, toDate, sortByDate, page = 1, limit = 10, searchTerm, sortByAmount } = req.query;
    const user = req.user;

    if (status) filters.status = status;
    if (searchTerm) {
      filters.$or = [
        { orderCode: { $regex: searchTerm, $options: 'i' } },
        { shippingAddress: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (user.role === 'admin') {
      if (req.query.userId) filters.userId = req.query.userId;
    } else if (user.role === 'customer') {
      filters.userId = user.id;
    } else {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập đơn hàng' });
    }

    if (fromDate || toDate) {
      filters.createdAt = {};
      if (fromDate) filters.createdAt.$gte = new Date(fromDate);
      if (toDate) filters.createdAt.$lte = new Date(toDate);
    }

    const sortOptions = {};
    if (sortByDate) {
      sortOptions.createdAt = sortByDate === 'asc' ? 1 : -1;
    } else if (sortByAmount) {
      sortOptions.totalAmount = sortByAmount === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const totalOrders = await Order.countDocuments(filters);
    const orders = await Order.find(filters)
      .populate('userId', 'name')
      .populate('voucherId', 'code')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // ✅ Gắn thêm payment info và items cho từng order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const payment = await Payment.findOne({ orderId: order._id }).lean();
        const items = await Order_Item.find({ orderId: order._id }).lean();
        return {
          ...order.toObject(),
          payment,
          items 
        };
      })
    );

    res.status(200).json({
      data: ordersWithDetails,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: parseInt(page),
      totalOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name')
      .populate('voucherId', 'code');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const items = await Order_Item.find({ orderId: order._id });
    const payment = await Payment.findOne({ orderId: order._id });

    res.status(200).json({
      success: true,
      data: {
        order,
        items,
        payment
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, shippingAddress } = req.body;
    const user = req.user;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // === CUSTOMER ===
    if (user.role === 'customer') {
      if (order.userId.toString() !== user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa đơn hàng này' });
      }

      if (status !== 'cancelled') {
        return res.status(403).json({ success: false, message: 'Bạn chỉ có thể huỷ đơn (cancelled)' });
      }

      if (!['pending'].includes(order.status)) {
        return res.status(400).json({ success: false, message: 'Chỉ được huỷ đơn khi đang ở trạng thái pending' });
      }

      order.status = 'cancelled';

      // Khách hàng hủy đơn => hoàn lại voucher (nếu có)
      if (order.voucherId) {
          // 1. Luôn giảm lượt sử dụng của voucher gốc và kích hoạt lại nó
          await Voucher.findByIdAndUpdate(order.voucherId, { 
              $inc: { usedCount: -1 },
              isActive: true
          });

          // 2. Đánh dấu lại voucher cá nhân là "chưa sử dụng" (nếu tồn tại)
          await User_Voucher.findOneAndUpdate(
              { userId: order.userId, voucherId: order.voucherId, isUsed: true },
              { isUsed: false }
          );
      }

      // Trả lại stock cho sản phẩm
      const orderItems = await Order_Item.find({ orderId: order._id });
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    }

    // === ADMIN ===
    else if (user.role === 'admin') {
      const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

      if (status) {
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        // Nếu admin huỷ đơn hàng, KHÔNG hoàn lại voucher, chỉ trả stock
        if (status === 'cancelled' && order.status !== 'cancelled') {
          const orderItems = await Order_Item.find({ orderId: order._id });
          for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
          }
        }

        order.status = status;
      }

      // Cập nhật địa chỉ nếu có
      if (shippingAddress) {
        order.shippingAddress = shippingAddress;
      }
    }

    // === OTHER ROLES ===
    else {
      return res.status(403).json({ success: false, message: 'Không có quyền cập nhật đơn hàng' });
    }

    order.updatedAt = new Date();
    await order.save();

    const payment = await Payment.findOne({ orderId: order._id });
    if (payment) {
      let paymentStatus = payment.status;
      let paidAt = payment.paidAt;

      if (order.status === 'delivered' && payment.status === 'unpaid') {
        paymentStatus = 'paid';
        paidAt = new Date();
      } else if (order.status === 'cancelled' && payment.status === 'paid') {
        paymentStatus = 'refunded';
        paidAt = null;
      }

      // Cập nhật payment nếu có thay đổi
      if (paymentStatus !== payment.status || paidAt !== payment.paidAt) {
        await PaymentController.updatePaymentByOrderId(
          order._id,
          paymentStatus,
          paidAt
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await Order_Item.deleteMany({ orderId: order._id });
    await Payment.deleteMany({ orderId: order._id });

    res.status(200).json({
      success: true,
      message: 'Order and related items deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
