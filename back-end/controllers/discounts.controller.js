const Discount = require('../models/discounts.model');
const mongoose = require('mongoose');

// Create a new discount
const createDiscount = async (req, res) => {
  try {
    const { productId, discount, discountEndDate } = req.body;
    
    const newDiscount = new Discount({
      productId,
      discount,
      discountEndDate,
      isActive: true
    });

    const savedDiscount = await newDiscount.save();
    return res.status(201).json(savedDiscount);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Get all discounts
const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find().populate('productId');
    return res.status(200).json(discounts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get a single discount by ID
const getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id).populate('productId');
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    return res.status(200).json(discount);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update a discount
const updateDiscount = async (req, res) => {
  try {
    const { productId, discount, discountEndDate, isActive } = req.body;
    
    const updatedDiscount = await Discount.findByIdAndUpdate(
      req.params.id,
      { productId, discount, discountEndDate, isActive },
      { new: true, runValidators: true }
    ).populate('productId');

    if (!updatedDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    
    return res.status(200).json(updatedDiscount);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Delete a discount
const deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    return res.status(200).json({ message: 'Discount deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount
};