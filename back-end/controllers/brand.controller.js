const Brand = require('../models/brand.model');
const Product = require('../models/product.model');

exports.createBrand = async (req, res) => {
  try {
    const brand = new Brand(req.body);
    const savedBrand = await brand.save();
    res.status(201).json(savedBrand);
  } catch (error) {
    console.error('Error creating brand:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getAllBrands = async (req, res) => {
  try {
    const { name, page = 1, limit = 100, isActive } = req.query;
    const query = {};
    // Chỉ lọc isActive nếu query string isActive được cung cấp
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (name) query.name = { $regex: name, $options: 'i' };
    const brands = await Brand.find(query);
    console.log('Brands fetched:', brands);
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    res.status(200).json(brand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });

    const activeProducts = await Product.countDocuments({ 'details.brandId': brand._id, stock: { $gt: 0 }, isActive: true });
    if (activeProducts > 0) {
      return res.status(400).json({ message: 'Cannot delete brand with active products in stock' });
    }

    brand.isActive = false;
    await brand.save();
    res.status(200).json({ message: 'Brand deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};