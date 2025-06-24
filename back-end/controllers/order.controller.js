const Order = require('../models/order.model');
const Order_Item = require('../models/order_item.model');
const Product = require('../models/product.model');
const Voucher = require('../models/voucher.model');
const Payment = require('../models/payment.model');
const PaymentController = require('./payment.controller');
const User_Voucher = require('../models/user_voucher.model');
const User = require('../models/user.model'); 
const { sendOrderCodeToGuestEmail } = require('../services/email.service'); 

exports.createOrderGuest = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      paymentMethod
    } = req.body;

    const order = new Order({
      userId: null, // vì là khách
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      orderCode: `ORD-${Date.now()}`,
      status: 'pending',
      voucherId: null
    });

    let originalTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm ${product?.name || 'này'} không khả dụng hoặc không đủ hàng`
        });
      }

      product.stock -= item.quantity;
      await product.save();

      const subtotal = product.price * item.quantity;
      originalTotal += subtotal;

      orderItems.push({
        orderId: order._id,
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        productImage: product.image,
      });
    }

    // Không giảm giá vì không dùng voucher
    order.totalAmount = Number(originalTotal.toFixed(2));
    order.discountAmount = 0;

    const savedOrder = await order.save();
    await Order_Item.insertMany(orderItems);

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
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ message: `Sản phẩm ${product?.name || 'này'} không khả dụng hoặc không đủ hàng` });
      }

      product.stock -= item.quantity;
      await product.save();

      const subtotal = product.price * item.quantity;
      originalTotal += subtotal;

      orderItems.push({
        orderId: order._id,
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        productImage: product.image,
      });
    }

    let userVoucher = null;

    if (voucherId) {
      const voucher = await Voucher.findById(voucherId);
      if (!voucher || !voucher.isActive) {
        return res.status(400).json({ message: 'Voucher không hợp lệ hoặc không hoạt động' });
      }

      const now = new Date();
      if ((voucher.startDate && now < voucher.startDate) || (voucher.endDate && now > voucher.endDate)) {
        return res.status(400).json({ message: 'Voucher không nằm trong thời gian áp dụng' });
      }

      if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
        return res.status(400).json({ message: 'Voucher đã hết lượt sử dụng' });
      }

      userVoucher = await User_Voucher.findOne({ userId: req.user.id, voucherId });
      if (userVoucher) {
        if (userVoucher.isUsed) {
          return res.status(400).json({ message: 'Voucher cá nhân đã được sử dụng' });
        }
      } else {
        const isShared = await User_Voucher.findOne({ voucherId });
        if (isShared) {
          return res.status(400).json({ message: 'Voucher chỉ được cấp riêng cho người dùng khác' });
        }
      }

      if (voucher.minOrderAmount && originalTotal < voucher.minOrderAmount) {
        return res.status(400).json({
          message: `Đơn hàng cần tối thiểu ${voucher.minOrderAmount} để áp dụng voucher`,
        });
      }

      if (voucher.totalOrderAmount && voucher.totalOrderAmount > 0) {
        const totalCompletedOrders = await Order.aggregate([
          {
            $match: {
              userId: order.userId,
              status: 'delivered',
            }
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: "$totalAmount" }
            }
          }
        ]);

        const totalSpent = totalCompletedOrders[0]?.totalSpent || 0;
        if (totalSpent < voucher.totalOrderAmount) {
          return res.status(400).json({ message: `Voucher không khả dụng` });
        }
      }

      const value = parseFloat(voucher.value);
      discountAmount = voucher.type === 'percent'
        ? originalTotal * (value / 100)
        : value;

      if (discountAmount > originalTotal) discountAmount = originalTotal;
    }

    order.totalAmount = Number((originalTotal - discountAmount).toFixed(2));
    order.discountAmount = Number(discountAmount.toFixed(2));

    const savedOrder = await order.save();
    await Order_Item.insertMany(orderItems);

    if (voucherId) {
      const updatedVoucher = await Voucher.findByIdAndUpdate(
        voucherId,
        { $inc: { usedCount: 1 } },
        { new: true }
      );

      if (updatedVoucher.usageLimit && updatedVoucher.usedCount >= updatedVoucher.usageLimit) {
        updatedVoucher.isActive = false;
        await updatedVoucher.save();
      }

      if (userVoucher) {
        await User_Voucher.findByIdAndUpdate(userVoucher._id, {
          isUsed: true,
        });
      }
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
      .populate('userId', 'name phone')
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
      if (order.userId?.toString() !== user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa đơn hàng này' });
      }

      if (status === 'cancelled') {
        order.status = 'cancelled';

        // Hoàn lại voucher nếu có
        if (order.voucherId) {
          await Voucher.findByIdAndUpdate(order.voucherId, {
            $inc: { usedCount: -1 },
            isActive: true
          });

          await User_Voucher.findOneAndUpdate(
            { userId: order.userId, voucherId: order.voucherId, isUsed: true },
            { isUsed: false }
          );
        }

        const orderItems = await Order_Item.find({ orderId: order._id });
        for (const item of orderItems) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        }
      } else if (order.status === 'pending') {
        if (shippingAddress && !order.addressChanged) {
          order.shippingAddress = shippingAddress;
          order.addressChanged = true;
        } else if (shippingAddress && order.addressChanged) {
          return res.status(400).json({ success: false, message: 'Bạn chỉ được đổi địa chỉ 1 lần khi đơn hàng đang chờ xử lý.' });
        }
      } else if (shippingAddress) {
        return res.status(400).json({ success: false, message: 'Chỉ được đổi địa chỉ khi đơn hàng đang chờ xử lý.' });
      }
    }

    // === ADMIN ===
    else if (user.role === 'admin') {
      const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

      if (status) {
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        // 👇 Nếu trạng thái hiện tại là pending và đơn không gắn userId → gửi mail nếu chưa có account
        if (
          order.status === 'pending' &&
          !order.userId &&
          order.customerEmail
        ) {
          const existingUser = await User.findOne({ email: order.customerEmail });
          if (!existingUser) {
            try {
              await sendOrderCodeToGuestEmail(order.customerEmail, order.orderCode);
            } catch (emailError) {
              console.error('Gửi email thất bại:', emailError);
              // Không return lỗi, chỉ log để không cản luồng xử lý đơn hàng
            }
          }
        }

        // Nếu admin hủy đơn, KHÔNG hoàn voucher
        if (status === 'cancelled' && order.status !== 'cancelled') {
          const orderItems = await Order_Item.find({ orderId: order._id });
          for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
          }
        }

        order.status = status;
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
