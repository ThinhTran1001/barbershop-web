const FeedbackBarber = require('../models/feedbackBarber.model');

// GET all feedbacks (admin)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, startDate, endDate } = req.query;
    console.log('Request query:', req.query); // Log query params

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

    console.log('Query:', query); // Log constructed query
    const feedbacks = await FeedbackBarber.find(query)
      .populate('barberId', 'name email')
      .populate('customerId', 'name email')
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await FeedbackBarber.countDocuments(query);
    console.log('Feedbacks found:', feedbacks.length, 'Total:', total); // Log results

    const transformedFeedbacks = feedbacks.map(fb => ({
      ...fb.toObject(),
      reviewer: fb.customerId?.name || fb.customerId?.email || 'Unknown',
      product: fb.bookingId?._id || 'Service',
    }));

    res.json({ data: transformedFeedbacks, total });
  } catch (error) {
    console.error('Error in getAllFeedbacks:', error.stack); // Log full error stack
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
// GET feedback by ID
exports.getBarberFeedbackById = async (req, res) => {
  try {
    const feedback = await FeedbackBarber.findById(req.params.id)
      .populate('barberId', 'name email')
      .populate('customerId', 'name email')
      .populate('bookingId');
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const transformedFeedback = {
      ...feedback.toObject(),
      reviewer: feedback.customerId?.name || feedback.customerId?.email || 'Unknown',
      product: feedback.bookingId?._id || 'Service',
    };

    res.json({ data: transformedFeedback });
  } catch (error) {
    console.error('Error in getBarberFeedbackById:', error);
    res.status(500).json({ message: error.message });
  }
};

// POST create new feedback
exports.createBarberFeedback = async (req, res) => {
  try {
    const { bookingId, barberId, customerId, rating, comment, images } = req.body;

    if (!bookingId || !barberId || !customerId || !rating || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const feedback = new FeedbackBarber({
      bookingId,
      barberId,
      customerId,
      rating,
      comment,
      images: images || [],
      // Không cần set isApproved vì mặc định là true
    });

    await feedback.save();

    const populatedFeedback = await FeedbackBarber.findById(feedback._id)
      .populate('barberId', 'name email')
      .populate('customerId', 'name email')
      .populate('bookingId');

    const transformedFeedback = {
      ...populatedFeedback.toObject(),
      reviewer: populatedFeedback.customerId?.name || populatedFeedback.customerId?.email || 'Unknown',
      product: populatedFeedback.bookingId?._id || 'Service',
    };

    res.status(201).json({ message: 'Feedback created', data: transformedFeedback });
  } catch (error) {
    console.error('Error in createBarberFeedback:', error);
    res.status(500).json({ message: error.message });
  }
};

// PATCH approve/disapprove feedback
exports.updateApprovalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { isApproved } = req.body;

    // Convert string to boolean
    if (typeof isApproved === 'string') {
      isApproved = isApproved === 'true';
    }

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ message: 'isApproved must be a boolean' });
    }

    const feedback = await FeedbackBarber.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.isApproved = isApproved;
    await feedback.save();

    const populatedFeedback = await FeedbackBarber.findById(id)
      .populate('barberId', 'name email')
      .populate('customerId', 'name email')
      .populate('bookingId');

    const transformedFeedback = {
      ...populatedFeedback.toObject(),
      reviewer: populatedFeedback.customerId?.name || populatedFeedback.customerId?.email || 'Unknown',
      product: populatedFeedback.bookingId?._id || 'Service',
    };

    res.json({ message: 'Approval status updated', data: transformedFeedback });
  } catch (error) {
    console.error('Error in updateApprovalStatus:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET approved feedbacks only
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

    res.json({ data: transformedFeedbacks, total });
  } catch (error) {
    console.error('Error in getApprovedFeedbacks:', error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE feedback
exports.deleteBarberFeedback = async (req, res) => {
  try {
    const feedback = await FeedbackBarber.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    console.error('Error in deleteBarberFeedback:', error);
    res.status(500).json({ message: error.message });
  }
};
