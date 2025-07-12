const FeedbackBarber = require('../models/feedbackBarber.model');
const FeedbackBooking = require('../models/feedbackBooking.model');
const mongoose = require('mongoose');

exports.getAllFeedbacks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, startDate, endDate } = req.query;

    const query = {};
    
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.isApproved = false;
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    if (search) {
      query.comment = { $regex: search, $options: 'i' };
    }

    const feedbacks = await FeedbackBarber.find(query)
      .populate('barberId', 'name email')
      .populate('customerId', 'name email')
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await FeedbackBarber.countDocuments(query);

    const transformedFeedbacks = feedbacks.map(fb => ({
      ...fb.toObject(),
      reviewer: fb.customerId?.name || fb.customerId?.email || 'Unknown',
      product: fb.bookingId?._id || 'Service',
    }));

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
      .populate('barberId', 'name email')
      .populate('customerId', 'name email')  
      .populate('bookingId');

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

exports.createBarberFeedback = async (req, res) => {
  try {
    const { bookingId, barberId, customerId, rating, comment, images } = req.body;

    if (!bookingId || !barberId || !customerId || !rating || !comment) {
      return res.status(400).json({ message: 'Thiếu các trường bắt buộc' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId) ||
        !mongoose.Types.ObjectId.isValid(barberId) ||
        !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Định dạng ID không hợp lệ' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5' });
    }

    const existingFeedback = await FeedbackBooking.findOne({ bookingId, userId: customerId });
    if (existingFeedback && existingFeedback.status) {
      return res.status(400).json({ message: 'Bạn đã đánh giá booking này rồi' });
    }

    const feedback = new FeedbackBarber({
      bookingId,
      barberId,
      customerId,
      rating,
      comment,
      images: images || [],
      isApproved: true
    });

    await feedback.save();

    if (!existingFeedback) {
      await FeedbackBooking.create({ bookingId, userId: customerId });
    } else {
      await FeedbackBooking.findOneAndUpdate({ bookingId, userId: customerId }, { status: true });
    }

    const populatedFeedback = await FeedbackBarber.findById(feedback._id)
      .populate('barberId', 'name email')
      .populate('customerId', 'name email')
      .populate('bookingId');

    const transformedFeedback = {
      ...populatedFeedback.toObject(),
      reviewer: populatedFeedback.customerId?.name || populatedFeedback.customerId?.email || 'Unknown',
      product: populatedFeedback.bookingId?._id || 'Service',
    };

    res.status(201).json({ 
      message: 'Phản hồi đã được tạo thành công', 
      data: transformedFeedback 
    });
  } catch (error) {
    console.error('Error in createBarberFeedback:', error);
    res.status(500).json({ message: 'Không thể tạo phản hồi' });
  }
};

exports.updateApprovalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    console.log('UpdateApprovalStatus called with:', { id, isApproved });

    if (!id) {
      return res.status(400).json({ message: 'ID phản hồi là bắt buộc' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Định dạng ID phản hồi không hợp lệ' });
    }

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ message: 'isApproved phải là boolean' });
    }

    const existingFeedback = await FeedbackBarber.findById(id);
    if (!existingFeedback) {
      console.log('Feedback not found for ID:', id);
      return res.status(404).json({ message: 'Không tìm thấy phản hồi' });
    }

    console.log('Existing feedback:', existingFeedback);

    const feedback = await FeedbackBarber.findByIdAndUpdate(
      id,
      { isApproved },
      { new: true, runValidators: true }
    )
      .populate('barberId', 'name email')
      .populate('customerId', 'name email')
      .populate('bookingId');

    if (!feedback) {
      console.log('Feedback not found after update for ID:', id);
      return res.status(404).json({ message: 'Không tìm thấy phản hồi sau khi cập nhật' });
    }

    console.log('Updated feedback:', feedback);

    const transformedFeedback = {
      ...feedback.toObject(),
      reviewer: feedback.customerId?.name || feedback.customerId?.email || 'Unknown',
      product: feedback.bookingId?._id || 'Service',
    };

    res.json({ 
      message: `Phản hồi đã được ${isApproved ? 'duyệt' : 'bỏ duyệt'} thành công`, 
      data: transformedFeedback 
    });
  } catch (error) {
    console.error('Error in updateApprovalStatus:', error);
    res.status(500).json({ 
      message: 'Không thể cập nhật trạng thái duyệt',
      error: error.message 
    });
  }
};

exports.getApprovedFeedbacks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate } = req.query;

    const query = { isApproved: true };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    if (search) {
      query.comment = { $regex: search, $options: 'i' };
    }

    const feedbacks = await FeedbackBarber.find(query)
      .populate('barberId', 'name email')
      .populate('customerId', 'name email')
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await FeedbackBarber.countDocuments(query);

    const transformedFeedbacks = feedbacks.map(fb => ({
      ...fb.toObject(),
      reviewer: fb.customerId?.name || fb.customerId?.email || 'Unknown',
      product: fb.bookingId?._id || 'Service',
    }));

    res.json({ 
      data: transformedFeedbacks, 
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error in getApprovedFeedbacks:', error);
    res.status(500).json({ message: 'Không thể lấy danh sách phản hồi đã duyệt' });
  }
};

exports.deleteBarberFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('DeleteBarberFeedback called with ID:', id);

    if (!id) {
      return res.status(400).json({ message: 'ID phản hồi là bắt buộc' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Định dạng ID phản hồi không hợp lệ' });
    }

    const existingFeedback = await FeedbackBarber.findById(id);
    if (!existingFeedback) {
      console.log('Feedback not found for ID:', id);
      return res.status(404).json({ message: 'Không tìm thấy phản hồi' });
    }

    console.log('Found feedback to delete:', existingFeedback);

    await FeedbackBarber.findByIdAndDelete(id);

    console.log('Successfully deleted feedback with ID:', id);

    res.json({ 
      message: 'Phản hồi đã được xóa thành công',
      deletedId: id
    });
  } catch (error) {
    console.error('Error in deleteBarberFeedback:', error);
    res.status(500).json({ 
      message: 'Không thể xóa phản hồi',
      error: error.message 
    });
  }
};