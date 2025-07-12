// controllers/feedbackOrder.controller.js
const FeedbackOrder = require('../models/feedbackOrder.model');
const mongoose = require('mongoose');

exports.createFeedbackOrder = async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    const existingFeedback = await FeedbackOrder.findOne({ orderId, userId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback order already exists' });
    }
    const feedbackOrder = new FeedbackOrder({ orderId, userId });
    const savedFeedbackOrder = await feedbackOrder.save();
    res.status(201).json(savedFeedbackOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateFeedbackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const feedbackOrder = await FeedbackOrder.findOneAndUpdate(
      { orderId },
      { status },
      { new: true, runValidators: true }
    );
    if (!feedbackOrder) return res.status(404).json({ message: 'Feedback order not found' });
    res.status(200).json(feedbackOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getFeedbackOrderByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const feedbackOrder = await FeedbackOrder.findOne({ orderId }).populate('userId');
    if (!feedbackOrder) return res.status(404).json({ message: 'Feedback order not found' });
    res.status(200).json(feedbackOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};