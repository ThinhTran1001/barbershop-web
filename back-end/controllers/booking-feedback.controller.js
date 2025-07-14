const BookingFeedback = require('../models/booking-feedback.model');
const Booking = require('../models/booking.model');
const Barber = require('../models/barber.model');
const Service = require('../models/service.model');

// Create feedback for a booking
exports.createBookingFeedback = async (req, res) => {
  try {
    const {
      bookingId,
      rating,
      serviceQuality,
      barberProfessionalism,
      cleanliness,
      valueForMoney,
      wouldRecommend,
      comment,
      images,
      isAnonymous
    } = req.body;

    const customerId = req.userId;

    // Verify booking exists and belongs to customer
    const booking = await Booking.findById(bookingId)
      .populate('barberId')
      .populate('serviceId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== customerId) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Check if feedback already exists
    const existingFeedback = await BookingFeedback.findOne({ bookingId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already exists for this booking' });
    }

    // Create feedback
    const feedback = new BookingFeedback({
      bookingId,
      customerId,
      barberId: booking.barberId._id,
      serviceId: booking.serviceId._id,
      rating,
      serviceQuality,
      barberProfessionalism,
      cleanliness,
      valueForMoney,
      wouldRecommend,
      comment,
      images: images || [],
      isAnonymous: isAnonymous || false,
      status: 'approved', // Auto-approve for now
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await feedback.save();

    // Populate the response
    const populatedFeedback = await BookingFeedback.findById(feedback._id)
      .populate('customerId', 'name email')
      .populate('barberId', 'userId specialties')
      .populate('serviceId', 'name price')
      .populate({
        path: 'barberId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    res.status(201).json({
      feedback: populatedFeedback,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get feedback for a specific booking
exports.getBookingFeedback = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    // Verify booking belongs to user or user is barber/admin
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const User = require('../models/user.model');
    const user = await User.findById(userId);
    const isBarber = await Barber.findOne({ userId });
    
    if (booking.customerId.toString() !== userId && 
        booking.barberId.toString() !== isBarber?._id.toString() && 
        user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this feedback' });
    }

    const feedback = await BookingFeedback.findOne({ bookingId })
      .populate('customerId', 'name email')
      .populate('barberId', 'userId specialties')
      .populate('serviceId', 'name price')
      .populate({
        path: 'barberId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json({ feedback });

  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all feedback for a barber
exports.getBarberFeedback = async (req, res) => {
  try {
    const { barberId } = req.params;
    const {
      page = 1,
      limit = 10,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {
      barberId,
      status: 'approved',
      isPublic: true
    };

    if (rating) {
      filter.rating = Number(rating);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const feedback = await BookingFeedback.find(filter)
      .populate('customerId', 'name')
      .populate('serviceId', 'name price')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await BookingFeedback.countDocuments(filter);

    // Get barber statistics
    const stats = await BookingFeedback.getBarberAverageRating(barberId);

    res.json({
      feedback,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting barber feedback:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all feedback for a service
exports.getServiceFeedback = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const {
      page = 1,
      limit = 10,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {
      serviceId,
      status: 'approved',
      isPublic: true
    };

    if (rating) {
      filter.rating = Number(rating);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const feedback = await BookingFeedback.find(filter)
      .populate('customerId', 'name')
      .populate('barberId', 'userId specialties')
      .populate({
        path: 'barberId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await BookingFeedback.countDocuments(filter);

    // Get service statistics
    const stats = await BookingFeedback.getServiceAverageRating(serviceId);

    res.json({
      feedback,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting service feedback:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update feedback (within 7 days)
exports.updateBookingFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const customerId = req.userId;
    const updateData = req.body;

    const feedback = await BookingFeedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.customerId.toString() !== customerId) {
      return res.status(403).json({ message: 'Not authorized to update this feedback' });
    }

    if (!feedback.canBeEdited()) {
      return res.status(400).json({ message: 'Feedback can no longer be edited' });
    }

    // Update allowed fields
    const allowedFields = [
      'rating', 'serviceQuality', 'barberProfessionalism', 
      'cleanliness', 'valueForMoney', 'wouldRecommend', 
      'comment', 'images', 'isAnonymous'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        feedback[field] = updateData[field];
      }
    });

    await feedback.save();

    const updatedFeedback = await BookingFeedback.findById(feedbackId)
      .populate('customerId', 'name email')
      .populate('barberId', 'userId specialties')
      .populate('serviceId', 'name price')
      .populate({
        path: 'barberId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    res.json({
      feedback: updatedFeedback,
      message: 'Feedback updated successfully'
    });

  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark feedback as helpful/unhelpful
exports.markFeedbackHelpful = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { isHelpful } = req.body;

    const feedback = await BookingFeedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    await feedback.markAsHelpful(isHelpful);

    res.json({
      message: 'Feedback marked successfully',
      helpfulVotes: feedback.helpfulVotes,
      unhelpfulVotes: feedback.unhelpfulVotes
    });

  } catch (error) {
    console.error('Error marking feedback:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add business response to feedback
exports.addBusinessResponse = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { message } = req.body;
    const userId = req.userId;

    const feedback = await BookingFeedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if user is barber or admin
    const User = require('../models/user.model');
    const user = await User.findById(userId);
    const isBarber = await Barber.findOne({ userId });
    
    if (feedback.barberId.toString() !== isBarber?._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to respond to this feedback' });
    }

    feedback.businessResponse = {
      message,
      respondedBy: userId,
      respondedAt: new Date()
    };

    await feedback.save();

    const updatedFeedback = await BookingFeedback.findById(feedbackId)
      .populate('customerId', 'name')
      .populate('businessResponse.respondedBy', 'name');

    res.json({
      feedback: updatedFeedback,
      message: 'Response added successfully'
    });

  } catch (error) {
    console.error('Error adding business response:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get customer's feedback history
exports.getCustomerFeedback = async (req, res) => {
  try {
    const customerId = req.userId;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const feedback = await BookingFeedback.find({ customerId })
      .populate('barberId', 'userId specialties')
      .populate('serviceId', 'name price')
      .populate('bookingId', 'bookingDate')
      .populate({
        path: 'barberId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await BookingFeedback.countDocuments({ customerId });

    res.json({
      feedback,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting customer feedback:', error);
    res.status(500).json({ message: error.message });
  }
};
