const Product = require('../models/product.model');
const Discount = require('../models/discounts.model');
const mongoose = require('mongoose');

exports.createProduct = async (req, res) => {
  try {
    if (req.body.categoryId && typeof req.body.categoryId === 'string') {
      req.body.categoryId = req.body.categoryId.split(',').map(id => mongoose.Types.ObjectId(id.trim()));
    }
   
    if (req.body.details && req.body.details.benefits && typeof req.body.details.benefits === 'string') {
      req.body.details.benefits = req.body.details.benefits.split(',').map(item => item.trim());
    }
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { name, brandId, categoryId, price, isActive } = req.query;
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (name) query.name = { $regex: name, $options: 'i' };
    if (brandId) query['details.brandId'] = brandId;
    if (categoryId) query.categoryId = { $in: categoryId.split(',') };
    if (price) query.price = { $lte: parseFloat(price) };

    const products = await Product.find(query);

    // Join discount còn hạn, active
    const productIds = products.map(p => p._id);
    const discounts = await Discount.find({
      productId: { $in: productIds },
      isActive: true,
      discountEndDate: { $gt: new Date() }
    });

    const discountMap = {};
    discounts.forEach(d => {
      discountMap[d.productId.toString()] = d.discount;
    });

    const result = products.map(p => {
      const obj = p.toObject();
      obj.discount = discountMap[p._id.toString()] || 0;
      return obj;
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Join discount còn hạn, active cho product này
    const discount = await Discount.findOne({
      productId: product._id,
      isActive: true,
      discountEndDate: { $gt: new Date() }
    });

    const obj = product.toObject();
    obj.discount = discount ? discount.discount : 0;

    res.status(200).json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    if (req.body.categoryId && typeof req.body.categoryId === 'string') {
      req.body.categoryId = req.body.categoryId.split(',').map(id => mongoose.Types.ObjectId(id.trim()));
    }
    
    if (req.body.details && req.body.details.benefits && typeof req.body.details.benefits === 'string') {
      req.body.details.benefits = req.body.details.benefits.split(',').map(item => item.trim());
    }
    
    // Ensure isActive can be updated
    const updateData = {
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};