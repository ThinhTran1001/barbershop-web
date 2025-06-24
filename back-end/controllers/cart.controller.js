const Cart = require('../models/cart.model')
const Product = require('../models/product.model');

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId', 'name price image');
    res.json(cart || { userId: req.user.id, items: [] });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy giỏ hàng', error: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity < 1) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({
        userId: req.user.id,
        items: [{ productId, quantity }],
        updatedAt: new Date()
      });
    } else {
      const existingItem = cart.items.find(item => item.productId.toString() === productId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
      cart.updatedAt = new Date();
    }

    await cart.save();
    res.status(200).json({ message: 'Đã thêm vào giỏ hàng', cart });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi thêm vào giỏ hàng', error: error.message });
  }
};

exports.updateItemQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity < 1) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

    const item = cart.items.find(item => item.productId.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ' });

    item.quantity = quantity;
    cart.updatedAt = new Date();

    await cart.save();
    res.json({ message: 'Cập nhật số lượng thành công', cart });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật giỏ hàng', error: error.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

    // Chuyển productId về ObjectId để so sánh
    const productIdObj = mongoose.Types.ObjectId(productId);

    cart.items = cart.items.filter(item => {
      // item.productId là ObjectId
      return !item.productId.equals(productIdObj);
    });
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: 'Đã xoá sản phẩm khỏi giỏ hàng', cart });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xoá sản phẩm', error: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: 'Đã xoá toàn bộ giỏ hàng', cart });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xoá giỏ hàng', error: error.message });
  }
};

const getCartCount = () => {
  if (!cart.items) return 0;
  // Đếm tổng số lượng sản phẩm
  return cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
};
