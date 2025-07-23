const Booking = require('../models/booking.model');
const mongoose = require('mongoose')
const BarberSchedule = require('../models/barber-schedule.model');
const BarberAbsence = require('../models/barber-absence.model');
const CustomerServiceHistory = require('../models/customer-service-history.model');
const NoShow = require('../models/no-show.model');

// Create a new booking with enhanced validation and conflict checking
exports.createBooking = async (req, res) => {
  try {
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

    // Check if customer has too many no-shows (block if >= 3)
    const noShowCount = await NoShow.countDocuments({ customerId });
    if (noShowCount >= 3) {
      return res.status(403).json({
        message: 'Booking blocked due to repeated no-shows. Please contact support.'
      });
    }

    // Check if barber is absent on the requested date
    const isBarberAbsent = await BarberAbsence.isBarberAbsent(barberId, requestedDateTime);
    if (isBarberAbsent) {
      return res.status(400).json({
        message: 'Selected barber is not available on this date'
      });
    }

    // Check for time slot conflicts
    const dateStr = requestedDateTime.toISOString().split('T')[0];

    // Check if time slot is already booked
    const existingBooking = await Booking.findOne({
      barberId,
      bookingDate: {
        $gte: new Date(dateStr + 'T00:00:00.000Z'),
        $lt: new Date(dateStr + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      // Check for time overlap
      const existingStart = new Date(existingBooking.bookingDate);
      const existingEnd = new Date(existingStart.getTime() + existingBooking.durationMinutes * 60000);
      const newStart = new Date(bookingDate);
      const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

      if ((newStart < existingEnd && newEnd > existingStart)) {
        return res.status(409).json({
          message: 'Time slot conflicts with existing booking',
          conflictingBooking: {
            date: existingBooking.bookingDate,
            duration: existingBooking.durationMinutes
          }
        });
      }
    }

    // Check barber's daily booking limit
    const Barber = require('../models/barber.model');
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    const dailyBookings = await Booking.countDocuments({
      barberId,
      bookingDate: {
        $gte: new Date(dateStr + 'T00:00:00.000Z'),
        $lt: new Date(dateStr + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (dailyBookings >= barber.maxDailyBookings) {
      return res.status(400).json({
        message: 'Barber has reached maximum bookings for this date'
      });
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
    res.status(400).json({ message: err.message });
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

    const filter = { customerId: req.userId };

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
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, reason } = req.body;
    const userId = req.userId;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check permissions
    const User = require('../models/user.model');
    const user = await User.findById(userId);
    const isCustomer = booking.customerId.toString() === userId;
    const isBarber = await require('../models/barber.model').findOne({ userId, _id: booking.barberId });
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isBarber && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Validate status transitions
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled', 'no_show'],
      'cancelled': [], // Cannot change from cancelled
      'completed': [], // Cannot change from completed
      'no_show': [] // Cannot change from no_show
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${booking.status} to ${status}`
      });
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

    booking.status = 'cancelled';
    booking.note = booking.note ? `${booking.note}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });

  } catch (err) {
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
    const { search, status, barberId, serviceId } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (barberId) filter.barberId = barberId;
    if (serviceId) filter.serviceId = serviceId;
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.customerName = regex; // chỉ tìm trong tên khách
    }

    const bookings = await Booking.find(filter)
      .populate({ path: 'barberId', populate: { path: 'userId', select: 'name' } })
      .populate('serviceId', 'name');

    res.status(200).json(bookings);
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

    // Check no-show
    const NoShow = require('../models/no-show.model');
    const noShowCount = await NoShow.countDocuments({ customerId: userId });
    if (noShowCount >= 3) {
      return {
        statusCode: 403,
        message: 'Tài khoản của bạn bị chặn đặt lịch do có nhiều lần không đến. Vui lòng liên hệ hỗ trợ.'
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
    const existingBookings = await Booking.find({
      barberId,
      bookingDate: {
        $gte: new Date(`${dateStr}T00:00:00.000Z`),
        $lt: new Date(`${dateStr}T23:59:59.999Z`)
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    const newStart = new Date(bookingDate);
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);
    const hasConflict = existingBookings.some(b => {
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

    if (existingBookings.length >= barber.maxDailyBookings) {
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
