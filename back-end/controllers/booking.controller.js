const Booking = require('../models/booking.model');
const mongoose = require('mongoose')
const BarberSchedule = require('../models/barber-schedule.model');
const BarberAbsence = require('../models/barber-absence.model');
const CustomerServiceHistory = require('../models/customer-service-history.model');
const NoShow = require('../models/no-show.model');
const { validateBookingConfirmation, validateBookingStatusUpdate, getBulkConfirmationError } = require('../utils/bookingValidation');

// Create a new booking with enhanced validation and conflict checking
exports.createBooking = async (req, res) => {
  try {
    // Use a simpler approach without transactions for standalone MongoDB
    // This provides basic conflict prevention through timing and validation

    const {
      barberId,
      serviceId,
      bookingDate,
      timeSlot, // "HH:MM" format
      durationMinutes,
      note,
      notificationMethods,
      autoAssignedBarber,
      customerName,
      customerEmail,
      customerPhone
    } = req.body;

    const customerId = req.userId;

    // Validation: Check if booking is at least 30 minutes in the future
    const now = new Date();
    const requestedDateTime = new Date(bookingDate);
    const timeDifference = requestedDateTime.getTime() - now.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    if (minutesDifference < 30) {
      return res.status(400).json({
        message: 'Bookings must be made at least 30 minutes in advance'
      });
    }

    // Enhanced no-show checking with detailed blocking logic
    const isBlocked = await NoShow.isCustomerBlocked(customerId, 3);
    if (isBlocked) {
      const noShowCount = await NoShow.getCustomerNoShowCount(customerId);
      return res.status(403).json({
        message: `Booking blocked due to ${noShowCount} cancellations/no-shows. Please contact support to resolve this issue.`,
        errorCode: 'CUSTOMER_BLOCKED',
        details: {
          noShowCount,
          limit: 3,
          contactSupport: true
        }
      });
    }

    // Check if barber is absent on the requested date
    const isBarberAbsent = await BarberAbsence.isBarberAbsent(barberId, requestedDateTime);
    if (isBarberAbsent) {
      return res.status(400).json({
        message: 'Selected barber is not available on this date'
      });
    }

    // CRITICAL: Enhanced conflict checking to prevent overlapping bookings
    const dateStr = requestedDateTime.toISOString().split('T')[0];

    // Get all existing bookings for the barber on this date
    const barberBookings = await Booking.find({
      barberId,
      bookingDate: {
        $gte: new Date(dateStr + 'T00:00:00.000Z'),
        $lt: new Date(dateStr + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ bookingDate: 1 });

    // CRITICAL: Check for customer conflicts across ALL barbers on this date
    const customerBookings = await Booking.find({
      customerId,
      bookingDate: {
        $gte: new Date(dateStr + 'T00:00:00.000Z'),
        $lt: new Date(dateStr + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    }).populate('barberId', 'userId')
      .populate({
        path: 'barberId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      });

    // Enhanced conflict detection with proper time overlap checking
    const newStart = new Date(bookingDate);
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

    // 1. Check for barber conflicts (same barber, overlapping time)
    const barberConflict = barberBookings.find(booking => {
      const existingStart = new Date(booking.bookingDate);
      const existingEnd = new Date(existingStart.getTime() + booking.durationMinutes * 60000);

      // Proper overlap detection: new booking overlaps with existing booking
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (barberConflict) {
      const affectedSlots = Math.ceil(durationMinutes / 30);
      const conflictingSlots = Math.ceil(barberConflict.durationMinutes / 30);

      return res.status(409).json({
        message: `Time slot conflict detected. Your ${durationMinutes}-minute service (${newStart.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})} - ${newEnd.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}) overlaps with an existing ${barberConflict.durationMinutes}-minute booking (${new Date(barberConflict.bookingDate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})} - ${new Date(barberConflict.bookingDate).getTime() + barberConflict.durationMinutes * 60000 ? new Date(new Date(barberConflict.bookingDate).getTime() + barberConflict.durationMinutes * 60000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}) : 'N/A'}).`,
        conflictDetails: {
          conflictType: 'BARBER_CONFLICT',
          conflictingTime: barberConflict.bookingDate,
          conflictingDuration: barberConflict.durationMinutes,
          conflictingSlots: conflictingSlots,
          requestedTime: bookingDate,
          requestedDuration: durationMinutes,
          requestedSlots: affectedSlots,
          overlapStart: newStart > new Date(barberConflict.bookingDate) ? newStart : new Date(barberConflict.bookingDate),
          overlapEnd: newEnd < new Date(new Date(barberConflict.bookingDate).getTime() + barberConflict.durationMinutes * 60000) ? newEnd : new Date(new Date(barberConflict.bookingDate).getTime() + barberConflict.durationMinutes * 60000)
        },
        errorCode: 'BOOKING_CONFLICT'
      });
    }

    // 2. Check for customer conflicts (same customer, different barber, overlapping time)
    const customerConflict = customerBookings.find(booking => {
      const existingStart = new Date(booking.bookingDate);
      const existingEnd = new Date(existingStart.getTime() + booking.durationMinutes * 60000);

      // Proper overlap detection: new booking overlaps with customer's existing booking
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (customerConflict) {
      const conflictingBarberName = customerConflict.barberId?.userId?.name || 'Unknown Barber';

      return res.status(409).json({
        message: `You already have a booking during this time period. Your existing ${customerConflict.durationMinutes}-minute appointment with ${conflictingBarberName} (${new Date(customerConflict.bookingDate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})} - ${new Date(new Date(customerConflict.bookingDate).getTime() + customerConflict.durationMinutes * 60000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}) conflicts with your requested ${durationMinutes}-minute service (${newStart.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})} - ${newEnd.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}).`,
        conflictDetails: {
          conflictType: 'CUSTOMER_CONFLICT',
          conflictingBookingId: customerConflict._id,
          conflictingBarber: conflictingBarberName,
          conflictingTime: customerConflict.bookingDate,
          conflictingDuration: customerConflict.durationMinutes,
          requestedTime: bookingDate,
          requestedDuration: durationMinutes,
          overlapStart: newStart > new Date(customerConflict.bookingDate) ? newStart : new Date(customerConflict.bookingDate),
          overlapEnd: newEnd < new Date(new Date(customerConflict.bookingDate).getTime() + customerConflict.durationMinutes * 60000) ? newEnd : new Date(new Date(customerConflict.bookingDate).getTime() + customerConflict.durationMinutes * 60000)
        },
        errorCode: 'CUSTOMER_DOUBLE_BOOKING'
      });
    }

    // Check barber's daily booking limit
    const Barber = require('../models/barber.model');
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    // Use existing bookings count to check daily limit
    if (barberBookings.length >= barber.maxDailyBookings) {
      return res.status(400).json({
        message: 'Barber has reached maximum bookings for this date',
        errorCode: 'DAILY_LIMIT_EXCEEDED'
      });
    }

    // Validate service exists
    const Service = require('../models/service.model');
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Create the booking
    const booking = new Booking({
      customerId,
      barberId,
      serviceId,
      bookingDate: new Date(bookingDate),
      durationMinutes,
      note,
      notificationMethods,
      autoAssignedBarber,
      customerName,
      customerEmail,
      customerPhone
    });

    await booking.save();

    // CRITICAL: Mark time slots as booked in the barber schedule
    const BarberSchedule = require('../models/barber-schedule.model');
    const bookingStartTime = new Date(bookingDate);
    const startTimeStr = bookingStartTime.toTimeString().substring(0, 5); // Extract HH:MM

    try {
      const scheduleResult = await BarberSchedule.markSlotsAsBooked(
        barberId,
        dateStr,
        startTimeStr,
        durationMinutes,
        booking._id,
        null // No session for standalone MongoDB
      );

      console.log(`Successfully marked ${scheduleResult.totalSlotsBooked} slots as booked:`, scheduleResult.bookedSlots);
    } catch (scheduleError) {
      console.error('Error marking schedule slots as booked:', scheduleError);
      // Try to delete the booking if schedule update fails
      await Booking.findByIdAndDelete(booking._id);
      return res.status(409).json({
        message: 'Failed to reserve time slots in schedule: ' + scheduleError.message,
        errorCode: 'SCHEDULE_UPDATE_FAILED'
      });
    }

    // Update barber's total bookings count
    await Barber.findByIdAndUpdate(barberId, {
      $inc: { totalBookings: 1 }
    });

    // Populate the response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('serviceId', 'name price durationMinutes')
      .populate('barberId', 'userId specialties averageRating')
      .populate({
        path: 'barberId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    res.status(201).json({
      booking: populatedBooking,
      message: 'Booking created successfully'
    });

  } catch (err) {
    console.error('Error in createBooking:', err);
    res.status(500).json({
      message: err.message,
      errorCode: 'INTERNAL_ERROR'
    });
  }
};

// Lấy danh sách booking của user hiện tại với filtering và pagination
exports.getMyBookings = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'bookingDate',
      sortOrder = 'desc'
    } = req.query;

    // Start with role-based filter from middleware
    const filter = { ...req.bookingFilter };

    // Apply additional filters
    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate);
      if (endDate) filter.bookingDate.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const bookings = await Booking.find(filter)
      .populate('serviceId', 'name price durationMinutes category')
      .populate({
        path: 'barberId',
        select: 'userId specialties averageRating',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate('confirmedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      userRole: req.role // Include user role for frontend logic
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get pending bookings for admin review
exports.getPendingBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, barberId, serviceId, startDate, endDate } = req.query;

    // Only admins can access this endpoint
    if (req.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can view pending bookings' });
    }

    const filter = { status: { $in: ['pending', 'cancelled', 'confirmed', 'completed'] } };

    // Apply additional filters
    if (barberId) filter.barberId = barberId;
    if (serviceId) filter.serviceId = serviceId;
    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate);
      if (endDate) filter.bookingDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const bookings = await Booking.find(filter)
      .populate({
        path: 'barberId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('serviceId', 'name price durationMinutes')
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error in getPendingBookings:', err);
    res.status(500).json({ message: err.message });
  }
};

// Confirm a pending booking (admin only)
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.userId;

    // Only admins can confirm bookings
    if (req.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can confirm bookings' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Validate booking confirmation using utility function
    const validation = validateBookingConfirmation(booking);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    // Update booking status and audit fields
    booking.status = 'confirmed';
    booking.confirmedAt = new Date();
    booking.confirmedBy = adminId;
    await booking.save();

    // Populate the response
    const confirmedBooking = await Booking.findById(bookingId)
      .populate({
        path: 'barberId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('serviceId', 'name price durationMinutes')
      .populate('customerId', 'name email phone')
      .populate('confirmedBy', 'name email');

    res.json({
      booking: confirmedBooking,
      message: 'Booking confirmed successfully'
    });
  } catch (err) {
    console.error('Error in confirmBooking:', err);
    res.status(500).json({ message: err.message });
  }
};

// Bulk confirm multiple bookings (admin only)
exports.bulkConfirmBookings = async (req, res) => {
  try {
    const { bookingIds } = req.body;
    const adminId = req.userId;

    // Only admins can confirm bookings
    if (req.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can confirm bookings' });
    }

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of booking IDs' });
    }

    const results = [];
    const confirmedBookings = [];

    for (const bookingId of bookingIds) {
      try {
        const booking = await Booking.findById(bookingId);

        if (!booking) {
          results.push({ bookingId, status: 'error', message: 'Booking not found' });
          continue;
        }

        const validation = validateBookingConfirmation(booking);
        if (!validation.valid) {
          results.push({
            bookingId,
            status: 'error',
            message: getBulkConfirmationError(booking.status)
          });
          continue;
        }

        // Update booking
        booking.status = 'confirmed';
        booking.confirmedAt = new Date();
        booking.confirmedBy = adminId;
        await booking.save();

        results.push({ bookingId, status: 'success', message: 'Booking confirmed' });
        confirmedBookings.push(booking);
      } catch (error) {
        results.push({ bookingId, status: 'error', message: error.message });
      }
    }

    res.json({
      results,
      confirmedCount: confirmedBookings.length,
      totalProcessed: bookingIds.length,
      message: `Successfully confirmed ${confirmedBookings.length} out of ${bookingIds.length} bookings`
    });
  } catch (err) {
    console.error('Error in bulkConfirmBookings:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update booking status (with enhanced role-based permissions)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, reason } = req.body;
    const userId = req.userId;
    const userRole = req.role;

    // Use booking from middleware if available
    const booking = req.booking || await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Role-based status transition validation with date-based rules for barbers
    const validTransitions = {
      admin: {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled', 'no_show'],
        'cancelled': [],
        'completed': [],
        'no_show': []
      },
      barber: {
        'confirmed': ['completed', 'no_show'],
        'pending': [], // Barbers cannot see or modify pending bookings
        'cancelled': [],
        'completed': [],
        'no_show': []
      },
      customer: {
        'pending': ['cancelled'],
        'confirmed': [],
        'cancelled': [],
        'completed': [],
        'no_show': []
      }
    };

    // Validate status update using utility function
    const validation = validateBookingStatusUpdate(booking, status, userRole);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    // Additional validation for barbers: date-based status restrictions
    if (userRole === 'barber' && booking.status === 'confirmed') {
      const bookingDate = new Date(booking.bookingDate);
      const today = new Date();

      // Set time to start of day for accurate comparison
      bookingDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const isToday = bookingDate.getTime() === today.getTime();
      const isPast = bookingDate.getTime() < today.getTime();

      if (status === 'completed' && !isToday) {
        return res.status(400).json({
          message: 'Chỉ có thể đánh dấu "Hoàn thành" cho booking trong ngày hôm nay'
        });
      }

      if (status === 'no_show' && !isPast && !isToday) {
        return res.status(400).json({
          message: 'Chỉ có thể đánh dấu "Không đến" cho booking trong quá khứ hoặc hôm nay'
        });
      }
    }

    // Handle no-show status
    if (status === 'no_show') {
      if (!isBarber && !isAdmin) {
        return res.status(403).json({ message: 'Only barbers or admins can mark no-shows' });
      }

      // Record the no-show
      const noShow = new NoShow({
        customerId: booking.customerId,
        bookingId: booking._id,
        markedBy: userId,
        reason: reason || 'Customer did not show up'
      });
      await noShow.save();
    }

    // Handle completion
    if (status === 'completed') {
      // Create service history record
      const serviceHistory = new CustomerServiceHistory({
        customerId: booking.customerId,
        serviceId: booking.serviceId,
        bookingId: booking._id,
        barberId: booking.barberId,
        completedAt: new Date()
      });
      await serviceHistory.save();

      // Update service popularity
      const Service = require('../models/service.model');
      await Service.findByIdAndUpdate(booking.serviceId, {
        $inc: { popularity: 1 }
      });
    }

    // Handle schedule updates for status changes
    if (status === 'cancelled') {
      // Unmark time slots in the barber schedule
      const BarberSchedule = require('../models/barber-schedule.model');
      const bookingDate = new Date(booking.bookingDate);
      const dateStr = bookingDate.toISOString().split('T')[0];

      try {
        const scheduleResult = await BarberSchedule.unmarkSlotsAsBooked(
          booking.barberId,
          dateStr,
          booking._id,
          null // No session for this operation
        );

        console.log(`Successfully unmarked ${scheduleResult.totalSlotsUnbooked} slots for cancelled booking:`, scheduleResult.unbookedSlots);
      } catch (scheduleError) {
        console.error('Error unmarking schedule slots for cancelled booking:', scheduleError);
        // Don't fail the status update if schedule update fails, but log the error
      }
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(bookingId)
      .populate('serviceId', 'name price')
      .populate({
        path: 'barberId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    res.json({
      booking: updatedBooking,
      message: `Booking status updated to ${status}`
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.userId;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can cancel this booking
    if (booking.customerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled (not too close to appointment time)
    const now = new Date();
    const bookingTime = new Date(booking.bookingDate);
    const timeDifference = bookingTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 2) {
      return res.status(400).json({
        message: 'Cannot cancel booking less than 2 hours before appointment time'
      });
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.status(400).json({
        message: 'Cannot cancel booking with current status'
      });
    }

    // CRITICAL: Unmark time slots in the barber schedule
    const BarberSchedule = require('../models/barber-schedule.model');
    const bookingDate = new Date(booking.bookingDate);
    const dateStr = bookingDate.toISOString().split('T')[0];

    try {
      const scheduleResult = await BarberSchedule.unmarkSlotsAsBooked(
        booking.barberId,
        dateStr,
        booking._id,
        null // No session for standalone MongoDB
      );

      console.log(`Successfully unmarked ${scheduleResult.totalSlotsUnbooked} slots:`, scheduleResult.unbookedSlots);
    } catch (scheduleError) {
      console.error('Error unmarking schedule slots:', scheduleError);
      return res.status(500).json({
        message: 'Failed to free time slots in schedule: ' + scheduleError.message,
        errorCode: 'SCHEDULE_UPDATE_FAILED'
      });
    }

    booking.status = 'cancelled';
    booking.note = booking.note ? `${booking.note}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
    await booking.save();

    // Track cancellation as no-show record
    const NoShow = require('../models/no-show.model');

    // Determine if this is a late cancellation (less than 2 hours before appointment)
    const isLateCancellation = hoursDifference < 2;

    try {
      await NoShow.create({
        customerId: booking.customerId,
        bookingId: booking._id,
        barberId: booking.barberId,
        serviceId: booking.serviceId,
        originalBookingDate: booking.bookingDate,
        markedBy: userId,
        reason: isLateCancellation ? 'late_cancellation' : 'customer_cancelled',
        description: reason,
        isWithinPolicy: !isLateCancellation
      });

      console.log(`No-show record created for booking ${booking._id}, customer ${booking.customerId}`);
    } catch (noShowError) {
      console.error('Error creating no-show record:', noShowError);
      // Don't fail the cancellation if no-show tracking fails
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });

  } catch (err) {
    console.error('Error in cancelBooking:', err);
    res.status(500).json({ message: err.message });
  }
};

// Check availability for a specific time slot
exports.checkAvailability = async (req, res) => {
  try {
    const { barberId, bookingDate, durationMinutes } = req.body;

    if (!barberId || !bookingDate || !durationMinutes) {
      return res.status(400).json({
        message: 'Barber ID, booking date, and duration are required'
      });
    }

    const requestedDateTime = new Date(bookingDate);

    // Check if barber is absent
    const isAbsent = await BarberAbsence.isBarberAbsent(barberId, requestedDateTime);
    if (isAbsent) {
      return res.json({
        available: false,
        reason: 'Barber is absent on this date'
      });
    }

    // Check for conflicts
    const dateStr = requestedDateTime.toISOString().split('T')[0];
    const conflictingBookings = await Booking.find({
      barberId,
      bookingDate: {
        $gte: new Date(dateStr + 'T00:00:00.000Z'),
        $lt: new Date(dateStr + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Check for time overlaps
    const newStart = new Date(bookingDate);
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

    const hasConflict = conflictingBookings.some(booking => {
      const existingStart = new Date(booking.bookingDate);
      const existingEnd = new Date(existingStart.getTime() + booking.durationMinutes * 60000);
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (hasConflict) {
      return res.json({
        available: false,
        reason: 'Time slot conflicts with existing booking',
        conflictingBookings: conflictingBookings.map(booking => ({
          id: booking._id,
          date: booking.bookingDate,
          duration: booking.durationMinutes
        }))
      });
    }

    // Check daily booking limit
    const Barber = require('../models/barber.model');
    const barber = await Barber.findById(barberId);
    if (conflictingBookings.length >= barber.maxDailyBookings) {
      return res.json({
        available: false,
        reason: 'Barber has reached maximum bookings for this date'
      });
    }

    res.json({
      available: true,
      message: 'Time slot is available'
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get booking conflicts for admin dashboard
exports.getBookingConflicts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {
      status: { $in: ['pending', 'confirmed'] }
    };

    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate);
      if (endDate) filter.bookingDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate('barberId', 'userId')
      .populate('serviceId', 'name')
      .populate('customerId', 'name email')
      .sort({ bookingDate: 1 });

    // Group by barber and date to find conflicts
    const conflicts = [];
    const barberBookings = {};

    bookings.forEach(booking => {
      const barberId = booking.barberId._id.toString();
      const dateStr = booking.bookingDate.toISOString().split('T')[0];
      const key = `${barberId}-${dateStr}`;

      if (!barberBookings[key]) {
        barberBookings[key] = [];
      }
      barberBookings[key].push(booking);
    });

    // Check for overlaps within each barber's daily bookings
    Object.values(barberBookings).forEach(dayBookings => {
      if (dayBookings.length > 1) {
        for (let i = 0; i < dayBookings.length; i++) {
          for (let j = i + 1; j < dayBookings.length; j++) {
            const booking1 = dayBookings[i];
            const booking2 = dayBookings[j];

            const start1 = new Date(booking1.bookingDate);
            const end1 = new Date(start1.getTime() + booking1.durationMinutes * 60000);
            const start2 = new Date(booking2.bookingDate);
            const end2 = new Date(start2.getTime() + booking2.durationMinutes * 60000);

            if (start1 < end2 && start2 < end1) {
              conflicts.push({
                type: 'time_overlap',
                bookings: [booking1, booking2],
                barber: booking1.barberId,
                date: start1.toISOString().split('T')[0]
              });
            }
          }
        }
      }
    });

    res.json({
      conflicts,
      totalConflicts: conflicts.length
    });
 } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAllBookings = async (req, res) => {
  try {
    const { search, status, barberId, serviceId, page = 1, limit = 20 } = req.query;
    const userRole = req.role;

    // Start with role-based filter from middleware
    const filter = { ...req.bookingFilter };

    // Apply additional filters
    if (status) filter.status = status;
    if (barberId) filter.barberId = barberId;
    if (serviceId) filter.serviceId = serviceId;
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.customerName = regex;
    }

    // For barbers, ensure they only see confirmed bookings (enforced by middleware)
    // For admins, no additional restrictions

    const skip = (page - 1) * limit;
    const bookings = await Booking.find(filter)
      .populate({
        path: 'barberId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('serviceId', 'name price durationMinutes')
      .populate('customerId', 'name email phone')
      .populate('confirmedBy', 'name email')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      userRole // Include user role for frontend logic
    });
  } catch (err) {
    console.error('Error in getAllBookings:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'name')
      .populate({ path: 'barberId', populate: { path: 'userId', select: 'name' } })
      .populate('customerId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookingStats = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customerId');
    const now = new Date();
    const upcoming = bookings.filter(
      b => (b.status === 'pending' || b.status === 'confirmed') && new Date(b.bookingDate) >= now
    ).length;
    const past = bookings.filter(
      b => b.status === 'completed' || (new Date(b.bookingDate) < now && b.status !== 'cancelled' && b.status !== 'no_show')
    ).length;
    const cancelled = bookings.filter(
      b => b.status === 'cancelled' || b.status === 'no_show'
    ).length;
    const totalCustomer = new Set(bookings.map(b => b.customerId?._id || b.customerId)).size;
    res.json({ upcoming, past, cancelled, totalCustomer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookingChartStats = async (req, res) => {
  try {
    const { from, to, mode = 'day' } = req.query;

    const start = from ? new Date(from) : new Date();
    const end = to ? new Date(to) : new Date();

    const matchStage = {
      bookingDate: { $gte: start, $lte: end }
    };

    let groupStage;
    let projectStage;

    if (mode === 'day') {
      // Group by hour in a single day
      groupStage = { _id: { $hour: "$bookingDate" } };
      projectStage = {
        _id: 0,
        time: { $concat: [{ $toString: "$_id" }, ":00"] },
        pending: 1, confirmed: 1, completed: 1, cancelled: 1
      };
    } else if (mode === 'week') {
      // Group by day in the selected week
      groupStage = { _id: { $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" } } };
      projectStage = {
        _id: 0,
        date: "$_id",
        pending: 1, confirmed: 1, completed: 1, cancelled: 1
      };
    } else if (mode === 'month') {
      // Group by day in the selected month
      groupStage = { _id: { $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" } } };
      projectStage = {
        _id: 0,
        date: "$_id",
        pending: 1, confirmed: 1, completed: 1, cancelled: 1
      };
    } else if (mode === 'year') {
      // Group by month in the selected year
      groupStage = { _id: { $dateToString: { format: "%Y-%m", date: "$bookingDate" } } };
      projectStage = {
        _id: 0,
        month: "$_id",
        pending: 1, confirmed: 1, completed: 1, cancelled: 1
      };
    } else {
      return res.json({ data: [] });
    }

    const result = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          ...groupStage,
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
            }
          },
          confirmed: {
            $sum: {
              $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0]
            }
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
            }
          },
          cancelled: {
            $sum: {
              $cond: [
                { $or: [
                  { $eq: ["$status", "cancelled"] },
                  { $eq: ["$status", "no_show"] }
                ] },
                1, 0
              ]
            }
          }
        }
      },
      { $project: projectStage },
      { $sort: mode === 'year' ? { month: 1 } : mode === 'day' ? { time: 1 } : { date: 1 } }
    ]);

    console.log('Aggregation result:', result);
    res.json({ data: Array.isArray(result) ? result : [] });
  } catch (err) {
    console.error("Error in getBookingChartStats:", err);
    res.status(500).json({ message: err.message });
  }
};

// Use for chatbot ai
exports.createBookingFromBot = async (payload, userId) => {
  try {
    const {
      barberId,
      serviceId,
      bookingDate,
      timeSlot,
      durationMinutes,
      note,
      notificationMethods,
      autoAssignedBarber,
      customerName,
      customerEmail,
      customerPhone
    } = payload;

    // Validate 30 phút trước lịch hẹn
    const now = new Date();
    const requestedDateTime = new Date(bookingDate);
    const minutesDiff = (requestedDateTime - now) / (1000 * 60);
    if (minutesDiff < 30) {
      return { statusCode: 400, message: 'Lịch đặt phải cách thời điểm hiện tại ít nhất 30 phút.' };
    }

    // Enhanced no-show checking with detailed blocking logic
    const NoShow = require('../models/no-show.model');
    const isBlocked = await NoShow.isCustomerBlocked(userId, 3);
    if (isBlocked) {
      const noShowCount = await NoShow.getCustomerNoShowCount(userId);
      return {
        statusCode: 403,
        message: `Tài khoản của bạn bị chặn đặt lịch do có ${noShowCount} lần hủy/không đến. Vui lòng liên hệ hỗ trợ để giải quyết vấn đề này.`,
        errorCode: 'CUSTOMER_BLOCKED',
        details: {
          noShowCount,
          limit: 3,
          contactSupport: true
        }
      };
    }

    // Check nghỉ
    const BarberAbsence = require('../models/barber-absence.model');
    const isAbsent = await BarberAbsence.isBarberAbsent(barberId, requestedDateTime);
    if (isAbsent) {
      return { statusCode: 400, message: 'Thợ được chọn không làm việc vào ngày này.' };
    }

    // Check trùng lịch
    const Booking = require('../models/booking.model');
    const dateStr = requestedDateTime.toISOString().split('T')[0];
    const barberBookings = await Booking.find({
      barberId,
      bookingDate: {
        $gte: new Date(`${dateStr}T00:00:00.000Z`),
        $lt: new Date(`${dateStr}T23:59:59.999Z`)
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    const newStart = new Date(bookingDate);
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);
    const hasConflict = barberBookings.some(b => {
      const start = new Date(b.bookingDate);
      const end = new Date(start.getTime() + b.durationMinutes * 60000);
      return newStart < end && newEnd > start;
    });

    if (hasConflict) {
      return {
        statusCode: 409,
        message: 'Khung giờ bạn chọn đã bị trùng với lịch đặt trước đó.'
      };
    }

    // Check giới hạn booking mỗi ngày
    const Barber = require('../models/barber.model');
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return { statusCode: 404, message: 'Không tìm thấy thợ.' };
    }

    if (barberBookings.length >= barber.maxDailyBookings) {
      return {
        statusCode: 400,
        message: 'Thợ đã đạt giới hạn số lượng đặt lịch trong ngày.'
      };
    }

    // Tạo booking
    const booking = new Booking({
      customerId: userId,
      barberId,
      serviceId,
      bookingDate: new Date(bookingDate),
      durationMinutes,
      note,
      notificationMethods,
      autoAssignedBarber,
      customerName,
      customerEmail,
      customerPhone
    });

    await booking.save();

    // Cập nhật totalBookings
    await Barber.findByIdAndUpdate(barberId, { $inc: { totalBookings: 1 } });

    return {
      statusCode: 201,
      booking
    };

  } catch (err) {
    console.error('Lỗi trong createBookingFromBot:', err.message);
    return { statusCode: 500, message: 'Đã xảy ra lỗi nội bộ khi tạo booking.' };
  }
};

// Update booking details (edit booking)
exports.updateBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { serviceId, barberId, bookingDate, note, durationMinutes } = req.body;
    const userId = req.userId;
    const userRole = req.role;

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can edit this booking
    if (userRole === 'customer' && booking.customerId.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your own bookings' });
    }

    // Validate booking can be edited (only pending or confirmed)
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot edit ${booking.status} bookings`
      });
    }

    // Check if booking is in the past
    const bookingTime = new Date(bookingDate || booking.bookingDate);
    const now = new Date();

    if (bookingTime < now) {
      return res.status(400).json({
        message: 'Cannot edit past bookings'
      });
    }

    // Check if booking is within 24 hours (for customers)
    if (userRole === 'customer') {
      const hoursDifference = (bookingTime - now) / (1000 * 60 * 60);
      if (hoursDifference < 24) {
        return res.status(400).json({
          message: 'Cannot edit bookings within 24 hours of appointment time'
        });
      }
    }

    // If changing time slot, validate availability
    if (bookingDate && bookingDate !== booking.bookingDate.toISOString()) {
      try {
        const targetBarberId = barberId || booking.barberId;
        const targetDuration = durationMinutes || booking.durationMinutes;
        const requestedStart = new Date(bookingDate);
        const requestedEnd = new Date(requestedStart.getTime() + targetDuration * 60000);
        const dateStr = requestedStart.toISOString().split('T')[0];

        // Check for barber conflicts (excluding current booking)
        const barberBookings = await Booking.find({
          barberId: targetBarberId,
          _id: { $ne: bookingId }, // Exclude current booking
          bookingDate: {
            $gte: new Date(dateStr + 'T00:00:00.000Z'),
            $lt: new Date(dateStr + 'T23:59:59.999Z')
          },
          status: { $in: ['pending', 'confirmed'] }
        });

        // Check for customer conflicts (excluding current booking)
        const customerBookings = await Booking.find({
          customerId: booking.customerId,
          _id: { $ne: bookingId }, // Exclude current booking
          bookingDate: {
            $gte: new Date(dateStr + 'T00:00:00.000Z'),
            $lt: new Date(dateStr + 'T23:59:59.999Z')
          },
          status: { $in: ['pending', 'confirmed'] }
        });

        // Check for time conflicts
        const allConflictingBookings = [...barberBookings, ...customerBookings];
        for (const conflictBooking of allConflictingBookings) {
          const conflictStart = new Date(conflictBooking.bookingDate);
          const conflictEnd = new Date(conflictStart.getTime() + (conflictBooking.durationMinutes || 30) * 60000);

          if (
            (requestedStart >= conflictStart && requestedStart < conflictEnd) ||
            (requestedEnd > conflictStart && requestedEnd <= conflictEnd) ||
            (requestedStart <= conflictStart && requestedEnd >= conflictEnd)
          ) {
            const isCustomerConflict = conflictBooking.customerId.toString() === booking.customerId.toString();
            return res.status(409).json({
              message: isCustomerConflict
                ? 'You already have a booking at this time'
                : 'Selected time slot is not available',
              conflictType: isCustomerConflict ? 'CUSTOMER_CONFLICT' : 'BARBER_CONFLICT',
              conflictDetails: {
                conflictingTime: conflictBooking.bookingDate,
                conflictingBarber: isCustomerConflict ? null : targetBarberId
              }
            });
          }
        }

        // Check if barber is available (not absent)
        const BarberAbsence = require('../models/barber-absence.model');
        const isBarberAbsent = await BarberAbsence.isBarberAbsent(targetBarberId, requestedStart);
        if (isBarberAbsent) {
          return res.status(409).json({
            message: 'Barber is not available on this date',
            conflictType: 'BARBER_ABSENCE'
          });
        }

      } catch (validationError) {
        console.error('Time slot validation failed:', validationError);
        // Continue with update but log the error
      }
    }

    // Update booking fields
    const updateFields = {};
    if (serviceId) updateFields.serviceId = serviceId;
    if (barberId) updateFields.barberId = barberId;
    if (bookingDate) updateFields.bookingDate = new Date(bookingDate);
    if (note !== undefined) updateFields.note = note;
    if (durationMinutes) updateFields.durationMinutes = durationMinutes;

    // Update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateFields,
      { new: true }
    ).populate('serviceId', 'name price durationMinutes')
     .populate({
       path: 'barberId',
       populate: { path: 'userId', select: 'name email' }
     })
     .populate('customerId', 'name email phone');

    // If time slot changed, update barber schedule
    if (bookingDate && bookingDate !== booking.bookingDate.toISOString()) {
      const BarberSchedule = require('../models/barber-schedule.model');

      try {
        // Unmark old time slot
        const oldDate = booking.bookingDate;
        const oldDateStr = oldDate.toISOString().split('T')[0];

        await BarberSchedule.unmarkSlotsAsBooked(
          booking.barberId,
          oldDateStr,
          bookingId
        );

        // Mark new time slot
        const newDate = new Date(bookingDate);
        const newDateStr = newDate.toISOString().split('T')[0];
        const newStartTime = newDate.toTimeString().substring(0, 5);

        await BarberSchedule.markSlotsAsBooked(
          barberId || booking.barberId,
          newDateStr,
          [newStartTime],
          bookingId
        );

        console.log(`Updated schedule: unmarked old slot on ${oldDateStr}, marked ${newStartTime} on ${newDateStr}`);
      } catch (scheduleError) {
        console.error('Error updating barber schedule:', scheduleError);
        // Don't fail the booking update if schedule update fails
      }
    }

    res.json({
      booking: updatedBooking,
      message: 'Booking updated successfully'
    });

  } catch (err) {
    console.error('Error in updateBookingDetails:', err);
    res.status(500).json({ message: err.message });
  }
};
