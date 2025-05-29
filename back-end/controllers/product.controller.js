const Product = require('../models/product.model');
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
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
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
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

