const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  productImage: { type: String }
});

orderItemSchema.index({ orderId: 1 });

const Order_Item = mongoose.model('Order_Item', orderItemSchema);
module.exports = Order_Item;
