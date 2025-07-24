const FeedbackBarber = require('../models/feedbackBarber.model');
const FeedbackBooking = require('../models/feedbackBooking.model');
const Barber = require('../models/barber.model');
const mongoose = require('mongoose');

// Helper function to update barber rating
const updateBarberRating = async (barberId) => {
  try {
    const activeFeedbacks = await FeedbackBarber.find({ 
      barberId, 
      isDeleted: false,
      status: 'Approved'
    });

    if (activeFeedbacks.length === 0) {
      // If no active feedbacks, set rating to 0
      await Barber.findByIdAndUpdate(barberId, { 
        averageRating: 0, 
        ratingCount: 0 
      });
      return;
    }

    const totalRating = activeFeedbacks.reduce((sum, fb) => sum + fb.rating, 0);
    const averageRating = totalRating / activeFeedbacks.length;

    await Barber.findByIdAndUpdate(barberId, { 
      averageRating: Number(averageRating.toFixed(1)), 
      ratingCount: activeFeedbacks.length 
    });
  } catch (error) {
    console.error('Error updating barber rating:', error);
  }
};

exports.getAllFeedbacks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, startDate, endDate, rating, isDeleted, isApproved } = req.query;

    const query = {};
    if (typeof isDeleted !== 'undefined') {
      query.isDeleted = isDeleted === 'true';
    }
    if (typeof isApproved !== 'undefined') {
      query.isApproved = isApproved === 'true';
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (search) {
      query.comment = { $regex: search, $options: 'i' };
    }
    if (rating && rating !== 'All') {
      query.rating = Number(rating);
    }
    if (status) {
      query.status = status;
    }
    const feedbacks = await FeedbackBarber.find(query)
      .populate({ path: 'barberId', populate: { path: 'userId', select: 'name' } })
      .populate('customerId', 'name email')
      .populate('bookingId', 'bookingDate name title _id')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await FeedbackBarber.countDocuments(query);
    const transformedFeedbacks = feedbacks.map(fb => ({
      ...fb.toObject(),
      reviewer: fb.customerId?.name || fb.customerId?.email || 'Unknown',
      product: fb.bookingId?._id || 'Service',
    }));
    const allBarberIds = await FeedbackBarber.distinct('barberId');
    for (const barberId of allBarberIds) {
      await updateBarberRating(barberId);
    }
    res.json({ 
      data: transformedFeedbacks, 
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error in getAllFeedbacks:', error);
    res.status(500).json({ message: 'Không thể lấy danh sách phản hồi' });
  }
};

exports.getBarberFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID phản hồi không hợp lệ' });
    }

    const feedback = await FeedbackBarber.findById(id)
      .populate({ path: 'barberId', populate: { path: 'userId', select: 'name' } })
      .populate('customerId', 'name email')  
      .populate('bookingId', 'bookingDate name title _id');

    if (!feedback) {
      return res.status(404).json({ message: 'Không tìm thấy phản hồi' });
    }

    const transformedFeedback = {
      ...feedback.toObject(),
      reviewer: feedback.customerId?.name || feedback.customerId?.email || 'Unknown',
      product: feedback.bookingId?._id || 'Service',
    };

    res.json({ data: transformedFeedback });
  } catch (error) {
    console.error('Error in getBarberFeedbackById:', error);
    res.status(500).json({ message: 'Không thể lấy chi tiết phản hồi' });
  }
};

// feedbackBarber.controller.js
exports.createBarberFeedback = async (req, res) => {
  try {
    const { bookingId, barberId, customerId, rating, comment, images } = req.body;

    if (!bookingId || !barberId || !customerId || !rating || !comment) {
      return res.status(400).json({ 
        message: 'Thiếu các trường bắt buộc: bookingId, barberId, customerId, rating, hoặc comment' 
      });
    }

    const feedback = new FeedbackBarber({
      bookingId,
      barberId,
      customerId,
      rating,
      comment,
      images: Array.isArray(images) ? images : [],
      status: 'Unapproved'
    });

    await feedback.save();
    res.status(201).json({ 
      message: 'Phản hồi barber đã được tạo thành công', 
      data: feedback 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Không thể tạo phản hồi barber', 
      error: error.message 
    });
  }
};


exports.deleteBarberFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID phản hồi là bắt buộc' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Định dạng ID phản hồi không hợp lệ' });
    }

    const existingFeedback = await FeedbackBarber.findById(id);
    if (!existingFeedback) {
      return res.status(404).json({ message: 'Không tìm thấy phản hồi' });
    }

    const barberId = existingFeedback.barberId;

    // Soft delete: set isDeleted to true
    existingFeedback.isDeleted = true;
    await existingFeedback.save();

    // Update barber rating after soft delete
    await updateBarberRating(barberId);
    
    // Cập nhật rating cho tất cả barber để đảm bảo tính nhất quán
    const allBarberIds = await FeedbackBarber.distinct('barberId');
    for (const id of allBarberIds) {
      await updateBarberRating(id);
    }

    res.json({ 
      message: 'Phản hồi đã được xoá mềm thành công',
      deletedId: id
    });
  } catch (error) {
    console.error('Error in deleteBarberFeedback:', error);
    res.status(500).json({ 
      message: 'Không thể xoá mềm phản hồi',
      error: error.message 
    });
  }
};

exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Approved', 'Unapproved', 'Deleted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const feedback = await FeedbackBarber.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    feedback.status = status;
    if (status === 'Deleted') feedback.isDeleted = true;
    else feedback.isDeleted = false;
    await feedback.save();
    // Update barber rating after status change
    await updateBarberRating(feedback.barberId);
    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByBookingId = async (req, res) => {
  const { bookingId } = req.params;
  const feedback = await FeedbackBarber.findOne({ bookingId, isDeleted: false });
  return res.json(feedback || null);
};