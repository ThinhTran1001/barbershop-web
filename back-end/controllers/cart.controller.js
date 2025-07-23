const Cart = require('../models/cart.model');
const mongoose = require('mongoose');
const Discount = require('../models/discounts.model');

/** Lấy (hoặc khởi tạo) giỏ hàng của user */
exports.getCart = async (req, res) => {
  const userId = req.userId;

  let cart = await Cart.findOne({ userId }).populate('items.productId');
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  // Join discount cho từng productId
  await attachDiscountToCartItems(cart.items);
  return res.json({ message: 'Success', data: cart });
};

/** Thêm sản phẩm vào giỏ */
exports.addItem = async (req, res) => {
  const userId = req.userId;
  const { productId, quantity = 1 } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId))
    return res.status(400).json({ message: 'Invalid productId' });

  const cart = await Cart.findOneAndUpdate(
    { userId, 'items.productId': { $ne: productId } },                 
    { $push: { items: { productId, quantity } } },                 
    { new: true }
  );

  if (!cart) {
    // sản phẩm đã tồn tại ⇒ tăng số lượng
    await Cart.updateOne(
      { userId, 'items.productId': productId },
      { $inc: { 'items.$.quantity': quantity } }
    );
  }

  const updated = await Cart.findOne({ userId }).populate('items.productId');
  await attachDiscountToCartItems(updated.items);
  return res.json({ message: 'Added/Updated', data: updated });
};

/** Cập nhật số lượng một item */
exports.updateItem = async (req, res) => {
  const userId = req.userId;
  const { productId, quantity } = req.body;

  if (quantity < 1)
    return res.status(400).json({ message: 'Quantity must be ≥ 1' });

  await Cart.updateOne(
    { userId, 'items.productId': productId },
    { $set: { 'items.$.quantity': quantity } }
  );

  const cart = await Cart.findOne({ userId }).populate('items.productId');
  await attachDiscountToCartItems(cart.items);
  return res.json({ message: 'Quantity updated', data: cart });
};

/** Xoá một item khỏi giỏ */
exports.removeItem = async (req, res) => {
  const userId = req.userId;
  const { id: productId } = req.params;

  await Cart.updateOne(
    { userId },
    { $pull: { items: { productId } } }
  );

  const cart = await Cart.findOne({ userId }).populate('items.productId');
  await attachDiscountToCartItems(cart.items);
  return res.json({ message: 'Item removed', data: cart });
};

/** Xoá toàn bộ giỏ */
exports.clearCart = async (req, res) => {
  const userId = req.userId;
  await Cart.deleteMany({ userId });
  return res.json({ message: 'Cart cleared' });
};

// Hàm phụ trợ: join discount cho từng productId trong cart
async function attachDiscountToCartItems(items) {
  const now = new Date();
  const productIds = items.map(i => i.productId && i.productId._id ? i.productId._id : i.productId).filter(Boolean);
  if (productIds.length === 0) return;
  const discounts = await Discount.find({
    productId: { $in: productIds },
    isActive: true,
    discountEndDate: { $gt: now }
  });
  const discountMap = {};
  discounts.forEach(d => {
    discountMap[d.productId.toString()] = d.discount;
  });
  for (const item of items) {
    if (item.productId && typeof item.productId === 'object') {
      item.productId.discount = discountMap[item.productId._id?.toString()] || 0;
    }
  }
}
