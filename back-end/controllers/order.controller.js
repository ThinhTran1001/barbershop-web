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

    const orderCodeNumber = Math.floor(Date.now() % 9000000000000);
    const order = new Order({
      userId: null, // vì là khách
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      orderCode: `ORD-${orderCodeNumber}`,
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

      const subtotal = product.price * item.quantity;
      originalTotal += subtotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        productImage: product.image,
      });
    }

    order.totalAmount = Number(originalTotal.toFixed(2));
    order.discountAmount = 0;

    // ✅ Nếu là bank => tạo link PayOS và KHÔNG lưu đơn hàng
    if (paymentMethod === 'bank') {
      const payOS = req.app.get("payOS");

      const paymentLinkBody = {
        orderCode: orderCodeNumber,
        amount: parseInt(order.totalAmount),
        description: `Đơn hàng ${orderCodeNumber}`,
        items: orderItems.map(i => ({
          name: i.productName,
          quantity: i.quantity,
          price: parseInt(i.unitPrice)
        })),
        returnUrl: `http://localhost:5173/payos-success?orderCode=${orderCodeNumber}&success=true`,
        cancelUrl: `http://localhost:5173/checkout-guest?canceled=true`
      };

      const paymentLink = await payOS.createPaymentLink(paymentLinkBody);

      return res.status(200).json({
        success: true,
        message: 'Tạo link thanh toán thành công',
        redirectUrl: paymentLink.checkoutUrl,
        orderDraft: {
          orderCode: order.orderCode,
          orderData: {
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            items: orderItems.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.unitPrice
            })),
            originalSubtotal: originalTotal,
            discountedSubtotal: originalTotal,
            voucherDiscount: 0,
            totalAmount: originalTotal
          }
        }
      });
    }

    // ✅ Nếu là cash => tiến hành lưu order + order items
    const savedOrder = await order.save();

    const orderItemsWithOrderId = orderItems.map(i => ({
      ...i,
      orderId: savedOrder._id
    }));
    await Order_Item.insertMany(orderItemsWithOrderId);

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    await PaymentController.createUnpaidPayment(savedOrder._id, paymentMethod || 'cash');

    // ✅ Gửi email nếu có
    if (customerEmail) {
      try {
        await sendOrderCodeToGuestEmail(customerEmail, {
          orderCode: savedOrder.orderCode,
          orderDate: savedOrder.createdAt,
          items: orderItems,
          totalAmount: savedOrder.totalAmount,
          customerName
        });
      } catch (e) {
        console.error('Gửi email đơn hàng cho guest thất bại:', e);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: savedOrder
    });
  } catch (error) {
    console.error('Lỗi tạo đơn hàng:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.createOrder = async (req, res) => {
  try {

    const findUser = await User.findById(req.user.id);
    if (!findUser) return res.status(404).json({ success: false, message: 'User not found' });

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      voucherId,
      paymentMethod,
      originalSubtotal,
      discountedSubtotal,
      voucherDiscount,
      totalAmount
    } = req.body;

    const finalCustomerName = (customerName || findUser.name);
    const finalCustomerEmail = (customerEmail || findUser.email)
    const finalCustomerPhone = (customerPhone || findUser.phone);

    const orderCodeNumber = Math.floor(Date.now() % 9000000000000);

    const order = new Order({
      userId: req.user.id,
      orderCode: `ORD-${orderCodeNumber}`,
      customerName: finalCustomerName,
      customerEmail: finalCustomerEmail,
      customerPhone: finalCustomerPhone,
      status: 'pending',
      shippingAddress,
      voucherId: voucherId || null,
    });

    let finalOriginalTotal = originalSubtotal || 0;
    let finalDiscountedSubtotal = discountedSubtotal || 0;
    let finalVoucherDiscount = voucherDiscount || 0;
    let finalTotalAmount = totalAmount || 0;

    const orderItems = [];

    // Nếu frontend không gửi giá, tính lại từ đầu
    if (!originalSubtotal) {
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product || product.stock < item.quantity) {
          return res.status(400).json({ message: `Sản phẩm ${product?.name || 'này'} không khả dụng hoặc không đủ hàng` });
        }

        product.stock -= item.quantity;
        await product.save();

        const subtotal = product.price * item.quantity;
        finalOriginalTotal += subtotal;

        orderItems.push({
          orderId: order._id,
          customerName: finalCustomerName,
          customerEmail: finalCustomerEmail,
          customerPhone: finalCustomerPhone,
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          productImage: product.image,
        });
      }
    } else {
      // Sử dụng giá từ frontend
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product || product.stock < item.quantity) {
          return res.status(400).json({ message: `Sản phẩm ${product?.name || 'này'} không khả dụng hoặc không đủ hàng` });
        }

        product.stock -= item.quantity;
        await product.save();

        orderItems.push({
          orderId: order._id,
          customerName: finalCustomerName,
          customerEmail: finalCustomerEmail,
          customerPhone: finalCustomerPhone,
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: item.price || product.price, // Sử dụng giá từ frontend
          productImage: product.image,
        });
      }
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

      // Sử dụng giá sau giảm sản phẩm để kiểm tra minOrderAmount
      const checkAmount = finalDiscountedSubtotal || finalOriginalTotal;
      if (voucher.minOrderAmount && checkAmount < voucher.minOrderAmount) {
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

      const subtotal = finalDiscountedSubtotal || finalOriginalTotal;
      let discount = 0;
      if (voucher.type === 'percent') {
        if (voucher.maxDiscountAmount > 0) {
          discount = voucher.maxDiscountAmount;
        } else {
          discount = subtotal * (voucher.value / 100);
        }
      } else {
        discount = voucher.value;
      }
      discount = Math.min(discount, subtotal);

      finalVoucherDiscount = discount;
    }

    // Sử dụng giá từ frontend hoặc tính lại
    order.totalAmount = Number(finalTotalAmount || (subtotal - finalVoucherDiscount)).toFixed(2);
    order.discountAmount = Number(finalVoucherDiscount.toFixed(2));

    if (paymentMethod === 'bank') {
  const payOS = req.app.get("payOS");
  const paymentLinkBody = {
    orderCode: orderCodeNumber,
    amount: parseInt(order.totalAmount),
    description: `Don hang ${orderCodeNumber}`,
    items: orderItems.map(i => ({
      name: i.productName,
      quantity: i.quantity,
      price: parseInt(i.unitPrice)
    })),
    returnUrl: `http://localhost:5173/payos-success?orderCode=${order.orderCode}&success=true`,
    cancelUrl: `http://localhost:5173/checkout?canceled=true`
  };

  // ✅ KHÔNG lưu order, order items, payment ở đây

  const paymentLink = await payOS.createPaymentLink(paymentLinkBody);

  return res.status(200).json({
    success: true,
    message: 'Tạo link thanh toán thành công',
    redirectUrl: paymentLink.checkoutUrl,
    orderDraft: {
      orderCode: order.orderCode,
      orderData: {
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        customerPhone: finalCustomerPhone,
        shippingAddress,
        items,
        voucherId,
        originalSubtotal: finalOriginalTotal,
        discountedSubtotal: finalDiscountedSubtotal,
        voucherDiscount: finalVoucherDiscount,
        totalAmount: order.totalAmount
      }
    }
  });
}

    const savedOrder = await order.save();
    await Order_Item.insertMany(orderItems);

    // Đánh dấu voucher đã sử dụng ngay khi tạo đơn hàng thành công
    if (voucherId && req.user.id) {
      try {
        // Cập nhật User_Voucher
        await User_Voucher.findOneAndUpdate(
          { userId: req.user.id, voucherId },
          { isUsed: true }
        );

        // Cập nhật Voucher (tăng usedCount)
        const updatedVoucher = await Voucher.findByIdAndUpdate(
          voucherId,
          { $inc: { usedCount: 1 } },
          { new: true }
        );

        // Nếu voucher đã hết lượt sử dụng thì deactivate
        if (updatedVoucher.usageLimit && updatedVoucher.usedCount >= updatedVoucher.usageLimit) {
          updatedVoucher.isActive = false;
          await updatedVoucher.save();
        }
      } catch (voucherError) {
        console.error('Lỗi cập nhật voucher:', voucherError);
        // Không return lỗi, chỉ log để không cản luồng xử lý đơn hàng
      }
    }

    const orderObj = savedOrder.toObject ? savedOrder.toObject() : savedOrder;
    console.log('orderObj:', orderObj);

    // Gửi email xác nhận đơn hàng chỉ cho guest (không có userId)
    if (!req.user.id && customerEmail) {
      try {
        await sendOrderCodeToGuestEmail(
          customerEmail,
          {
            orderCode: orderObj.orderCode,
            orderDate: orderObj.createdAt,
            items: orderItems.map(item => ({
              productName: item.productName,
              quantity: item.quantity
            })),
            totalAmount: orderObj.totalAmount,
            customerName
          }
        );
      } catch (emailError) {
        console.error('Gửi email đơn hàng cho guest thất bại:', emailError);
        // Không return lỗi, chỉ log để không cản luồng xử lý đơn hàng
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
              const orderItems = await Order_Item.find({ orderId: order._id });
              await sendOrderCodeToGuestEmail(order.customerEmail, {
                orderCode: order.orderCode,
                orderDate: order.createdAt,
                items: orderItems.map(item => ({
                  productName: item.productName,
                  quantity: item.quantity,
                  productImage: item.productImage
                })),
                totalAmount: order.totalAmount,
                customerName: order.customerName
              });
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
        
        // Gửi email thông báo khi đơn hàng được giao thành công
        if (status === 'delivered' && order.customerEmail) {
          try {
            const orderItems = await Order_Item.find({ orderId: order._id });
            await sendOrderCodeToGuestEmail(order.customerEmail, {
              orderCode: order.orderCode,
              orderDate: order.createdAt,
              items: orderItems.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                productImage: item.productImage
              })),
              totalAmount: order.totalAmount,
              customerName: order.customerName,
              deliveryStatus: 'delivered'
            });
          } catch (emailError) {
            console.error('Gửi email thông báo giao hàng thành công thất bại:', emailError);
          }
        }
        
        // Voucher đã được đánh dấu sử dụng khi tạo đơn hàng thành công
        // Không cần đánh dấu lại khi chuyển trạng thái processing
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

exports.getOrderByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const order = await Order.findOne({ orderCode: code });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const items = await Order_Item.find({ orderId: order._id });
    const payment = await Payment.findOne({ orderId: order._id });

    res.json({ order, items, payment });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.finalizeOrderAuth = async (req, res) => {
  try {
    const { orderCode, orderData, userId } = req.body;
    if (!userId) return res.status(400).json({ message: "Thiếu userId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    const {
      customerName, customerEmail, customerPhone,
      shippingAddress, items, voucherId,
      originalSubtotal, discountedSubtotal,
      voucherDiscount, totalAmount
    } = orderData;

    const order = new Order({
      userId: userId,
      customerName: customerName || user.name,
      customerEmail: customerEmail || user.email,
      customerPhone: customerPhone || user.phone,
      shippingAddress,
      orderCode,
      status: 'pending',
      voucherId: voucherId || null,
      totalAmount,
      discountAmount: voucherDiscount || 0,
    });

    const savedOrder = await order.save();

    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        orderId: savedOrder._id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.price,
        productImage: product.image,
      });
    }

    await Order_Item.insertMany(orderItems);

    // Đánh dấu voucher đã sử dụng ngay khi tạo đơn hàng thành công
    if (voucherId && userId) {
      try {
        // Cập nhật User_Voucher
        await User_Voucher.findOneAndUpdate(
          { userId: userId, voucherId },
          { isUsed: true }
        );

        // Cập nhật Voucher (tăng usedCount)
        const updatedVoucher = await Voucher.findByIdAndUpdate(
          voucherId,
          { $inc: { usedCount: 1 } },
          { new: true }
        );

        // Nếu voucher đã hết lượt sử dụng thì deactivate
        if (updatedVoucher.usageLimit && updatedVoucher.usedCount >= updatedVoucher.usageLimit) {
          updatedVoucher.isActive = false;
          await updatedVoucher.save();
        }
      } catch (voucherError) {
        console.error('Lỗi cập nhật voucher:', voucherError);
        // Không return lỗi, chỉ log để không cản luồng xử lý đơn hàng
      }
    }

    await PaymentController.createUnpaidPayment(savedOrder._id, 'payOS');

    // ✅ Gửi email xác nhận đơn hàng
    if (customerEmail) {
      try {
        await sendOrderCodeToGuestEmail(customerEmail, {
          orderCode: savedOrder.orderCode,
          orderDate: savedOrder.createdAt,
          items: orderItems,
          totalAmount: savedOrder.totalAmount,
          customerName
        });
      } catch (e) {
        console.error('Gửi email xác nhận cho guest thất bại:', e);
      }
    }
    
    res.status(200).json({ success: true, order: savedOrder });
  } catch (err) {
    console.error("Finalize Auth Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.finalizeOrderGuest = async (req, res) => {
  try {
    const { orderCode, orderData } = req.body;

    const {
      customerName, customerEmail, customerPhone,
      shippingAddress, items, voucherId,
      originalSubtotal, discountedSubtotal,
      voucherDiscount, totalAmount
    } = orderData;

    const order = new Order({
      userId: null,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      orderCode,
      status: 'pending',
      voucherId: voucherId || null,
      totalAmount,
      discountAmount: voucherDiscount || 0,
    });

    const savedOrder = await order.save();

    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        orderId: savedOrder._id,
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.price,
        productImage: product.image,
      });
    }

    await Order_Item.insertMany(orderItems);
    await PaymentController.createUnpaidPayment(savedOrder._id, 'payOS');

    // ✅ Gửi email xác nhận đơn hàng
    if (customerEmail) {
      try {
        await sendOrderCodeToGuestEmail(customerEmail, {
          orderCode: savedOrder.orderCode,
          orderDate: savedOrder.createdAt,
          items: orderItems,
          totalAmount: savedOrder.totalAmount,
          customerName
        });
      } catch (e) {
        console.error('Gửi email xác nhận cho guest thất bại:', e);
      }
    }

    res.status(200).json({ success: true, order: savedOrder });
  } catch (err) {
    console.error("Finalize Guest Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
