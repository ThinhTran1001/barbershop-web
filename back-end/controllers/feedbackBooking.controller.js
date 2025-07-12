// controllers/feedbackBooking.controller.js
const FeedbackBooking = require('../models/feedbackBooking.model');
const mongoose = require('mongoose');

exports.createFeedbackBooking = async (req, res) => {
  try {
    const { bookingId, userId } = req.body;
    const existingFeedback = await FeedbackBooking.findOne({ bookingId, userId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback booking already exists' });
    }
    const feedbackBooking = new FeedbackBooking({ bookingId, userId });
    const savedFeedbackBooking = await feedbackBooking.save();
    res.status(201).json(savedFeedbackBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateFeedbackBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const feedbackBooking = await FeedbackBooking.findOneAndUpdate(
      { bookingId },
      { status },
      { new: true, runValidators: true }
    );
    if (!feedbackBooking) return res.status(404).json({ message: 'Feedback booking not found' });
    res.status(200).json(feedbackBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getFeedbackBookingByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const feedbackBooking = await FeedbackBooking.findOne({ bookingId }).populate('userId');
    if (!feedbackBooking) return res.status(404).json({ message: 'Feedback booking not found' });
    res.status(200).json(feedbackBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};