const Category = require('../models/category.model');
const Product = require('../models/product.model');

exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error creating category:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const { name, page = 1, limit = 100, isActive } = req.query;
    const query = {};
    // Chỉ lọc isActive nếu query string isActive được cung cấp
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (name) query.name = { $regex: name, $options: 'i' };
    const categories = await Category.find(query);
    console.log('Categories fetched:', categories);
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const activeProducts = await Product.countDocuments({ categoryId: category._id, stock: { $gt: 0 }, isActive: true });
    if (activeProducts > 0) {
      return res.status(400).json({ message: 'Cannot delete category with active products in stock' });
    }

    category.isActive = false;
    await category.save();
    res.status(200).json({ message: 'Category deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};