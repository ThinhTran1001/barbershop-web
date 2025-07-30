const Barber = require('../models/barber.model');
const Booking = require('../models/booking.model');
const BarberSchedule = require('../models/barber-schedule.model');
const ScheduleInitializerService = require('../services/schedule-initializer.service');

/**
 * Helper function to check if a time slot is available for a service with specific duration
 * @param {string} slotTime - Time in HH:MM format (e.g., "09:00")
 * @param {number} durationMinutes - Service duration in minutes
 * @param {Array} existingBookings - Array of existing bookings for the date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {boolean} - True if slot is available for the entire duration
 */
const isSlotAvailableForDuration = (slotTime, durationMinutes, existingBookings, date) => {
  const slotStart = new Date(`${date}T${slotTime}:00.000Z`);
  const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

  // Check if the proposed service time conflicts with any existing booking
  for (const booking of existingBookings) {
    const bookingStart = new Date(booking.bookingDate);
    const bookingEnd = new Date(bookingStart.getTime() + booking.durationMinutes * 60000);

    // Check for any overlap between the proposed service and existing booking
    // Overlap occurs if: (slotStart < bookingEnd) AND (slotEnd > bookingStart)
    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      return false; // Conflict found
    }
  }

  return true; // No conflicts found
};

// Get available time slots for a barber on a specific date with real-time conflict checking
exports.getAvailableSlots = async (req, res) => {
  try {
    const { barberId, date, serviceId, durationMinutes = 30, customerId } = req.query;
    if (!barberId || !date) {
      return res.status(400).json({ message: 'Missing barberId or date' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Get existing bookings for this barber on this date
    const barberBookings = await Booking.find({
      barberId,
      bookingDate: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ bookingDate: 1 });

    // Get customer's existing bookings across all barbers for this date (if customerId provided)
    let customerBookings = [];
    if (customerId) {
      customerBookings = await Booking.find({
        customerId,
        bookingDate: {
          $gte: new Date(date + 'T00:00:00.000Z'),
          $lt: new Date(date + 'T23:59:59.999Z')
        },
        status: { $in: ['pending', 'confirmed'] }
      }).sort({ bookingDate: 1 });
    }

    // Combine all conflicting bookings
    const allConflictingBookings = [...barberBookings, ...customerBookings];

    // Use the static method from BarberSchedule model to get the base schedule
    const result = await BarberSchedule.getAvailableSlots(barberId, date);

    // Filter out slots that are too close to current time (if today)
    if (result.available && result.slots.length > 0) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      let availableSlots = result.slots;

      if (date === today) {
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        availableSlots = availableSlots.filter(slot => {
          const [h, m] = slot.time.split(':').map(Number);
          const slotMinutes = h * 60 + m;
          return slotMinutes - nowMinutes >= 30; // 30 minutes buffer
        });
      }

      // Enhanced slot filtering: Check both schedule status AND duration-based conflicts
      const filteredSlots = availableSlots.filter(slot => {
        // First check: Is the slot marked as available in the schedule?
        if (slot.isBooked || slot.isBlocked) {
          return false;
        }

        // Second check: Would this service duration conflict with existing bookings?
        return isSlotAvailableForDuration(slot.time, parseInt(durationMinutes), allConflictingBookings, date);
      });

      // Convert slot objects to time strings for backward compatibility
      const timeSlots = filteredSlots.map(slot => slot.time);
      return res.json({
        available: true,
        slots: timeSlots,
        totalSlots: result.slots.length,
        availableSlots: timeSlots.length,
        bookedSlots: barberBookings.length,
        customerConflicts: customerBookings.length,
        scheduleBasedFiltering: true // Indicate we're using schedule-based filtering
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Error getting available slots:', err);
    res.status(500).json({ message: err.message });
  }
};

// Check if barber is off on a specific day
exports.isBarberOff = async (req, res) => {
  try {
    const { barberId, date } = req.query;
    if (!barberId || !date) {
      return res.status(400).json({ message: 'Missing barberId or date' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Find schedule for the specific date
    const schedule = await BarberSchedule.findOne({ barberId, date });

    if (!schedule) {
      // If no schedule exists, barber is not off (will be created when needed)
      return res.json({ isOff: false });
    }

    res.json({
      isOff: schedule.isOffDay || false,
      reason: schedule.offReason || null,
      absenceId: schedule.absenceId || null
    });
  } catch (err) {
    console.error('Error checking if barber is off:', err);
    res.status(500).json({ message: err.message });
  }
};

// Tạo schedule thủ công cho tất cả barber
exports.initializeSchedules = async (req, res) => {
  try {
    const { daysAhead = 7 } = req.body;

    await ScheduleInitializerService.initializeSchedules(daysAhead);

    res.json({
      message: `Successfully initialized schedules for ${daysAhead} days ahead`,
      success: true
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tạo schedule cho một barber cụ thể
exports.initializeScheduleForBarber = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { daysAhead = 7 } = req.body;

    await ScheduleInitializerService.initializeScheduleForBarber(barberId, daysAhead);

    res.json({
      message: `Successfully initialized schedules for barber ${barberId}`,
      success: true
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Chạy job bảo trì schedule
exports.runMaintenanceJob = async (req, res) => {
  try {
    await ScheduleInitializerService.runMaintenanceJob();

    res.json({
      message: 'Schedule maintenance job completed successfully',
      success: true
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Real-time availability validation for a specific time slot
exports.validateTimeSlotAvailability = async (req, res) => {
  try {
    const { barberId, bookingDate, durationMinutes, customerId } = req.body;

    if (!barberId || !bookingDate || !durationMinutes) {
      return res.status(400).json({
        message: 'Missing required fields: barberId, bookingDate, durationMinutes'
      });
    }

    const requestedStart = new Date(bookingDate);
    const requestedEnd = new Date(requestedStart.getTime() + durationMinutes * 60000);
    const dateStr = requestedStart.toISOString().split('T')[0];

    // Get all existing bookings for the barber on this date
    const barberBookings = await Booking.find({
      barberId,
      bookingDate: {
        $gte: new Date(dateStr + 'T00:00:00.000Z'),
        $lt: new Date(dateStr + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ bookingDate: 1 });

    // Get customer's existing bookings across all barbers for this date (if customerId provided)
    let customerBookings = [];
    if (customerId) {
      customerBookings = await Booking.find({
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
    }

    // Check for barber conflicts
    const barberConflict = barberBookings.find(booking => {
      const bookingStart = new Date(booking.bookingDate);
      const bookingEnd = new Date(bookingStart.getTime() + booking.durationMinutes * 60000);
      return (requestedStart < bookingEnd && requestedEnd > bookingStart);
    });

    if (barberConflict) {
      return res.json({
        available: false,
        reason: `Time slot conflicts with existing booking (${new Date(barberConflict.bookingDate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})} - ${new Date(new Date(barberConflict.bookingDate).getTime() + barberConflict.durationMinutes * 60000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})})`,
        conflictType: 'BARBER_CONFLICT',
        conflictingBooking: {
          id: barberConflict._id,
          date: barberConflict.bookingDate,
          duration: barberConflict.durationMinutes
        }
      });
    }

    // Check for customer conflicts (double-booking prevention)
    const customerConflict = customerBookings.find(booking => {
      const bookingStart = new Date(booking.bookingDate);
      const bookingEnd = new Date(bookingStart.getTime() + booking.durationMinutes * 60000);
      return (requestedStart < bookingEnd && requestedEnd > bookingStart);
    });

    if (customerConflict) {
      const conflictingBarberName = customerConflict.barberId?.userId?.name || 'Unknown Barber';
      return res.json({
        available: false,
        reason: `You already have a booking with ${conflictingBarberName} during this time (${new Date(customerConflict.bookingDate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})} - ${new Date(new Date(customerConflict.bookingDate).getTime() + customerConflict.durationMinutes * 60000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})})`,
        conflictType: 'CUSTOMER_CONFLICT',
        conflictingBooking: {
          id: customerConflict._id,
          date: customerConflict.bookingDate,
          duration: customerConflict.durationMinutes,
          barberName: conflictingBarberName
        }
      });
    }

    // Check if barber is available (not absent)
    const BarberAbsence = require('../models/barber-absence.model');
    const isBarberAbsent = await BarberAbsence.isBarberAbsent(barberId, requestedStart);
    if (isBarberAbsent) {
      return res.json({
        available: false,
        reason: 'Barber is not available on this date'
      });
    }

    // Check daily booking limit
    const Barber = require('../models/barber.model');
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    const dailyBookingsCount = await Booking.countDocuments({
      barberId,
      bookingDate: {
        $gte: new Date(dateStr + 'T00:00:00.000Z'),
        $lt: new Date(dateStr + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (dailyBookingsCount >= barber.maxDailyBookings) {
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
    console.error('Error in validateTimeSlotAvailability:', err);
    res.status(500).json({ message: err.message });
  }
};

// Admin endpoint to sync schedule with bookings
exports.syncScheduleWithBookings = async (req, res) => {
  try {
    const { barberId, date } = req.body;

    if (!barberId || !date) {
      return res.status(400).json({
        message: 'Missing required fields: barberId and date'
      });
    }

    const { syncBarberScheduleForDate } = require('../utils/scheduleSync');
    const result = await syncBarberScheduleForDate(barberId, date);

    if (result.success) {
      res.json({
        message: 'Schedule synced successfully',
        result
      });
    } else {
      res.status(500).json({
        message: 'Failed to sync schedule',
        error: result.error
      });
    }

  } catch (err) {
    console.error('Error in syncScheduleWithBookings:', err);
    res.status(500).json({ message: err.message });
  }
};

// Admin endpoint to validate schedule consistency
exports.validateScheduleConsistency = async (req, res) => {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json({
        message: 'Missing required parameters: barberId and date'
      });
    }

    const { validateScheduleConsistency } = require('../utils/scheduleSync');
    const result = await validateScheduleConsistency(barberId, date);

    res.json(result);

  } catch (err) {
    console.error('Error in validateScheduleConsistency:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get real-time availability with dynamic slot release for completed bookings
exports.getRealTimeAvailability = async (req, res) => {
  try {
    const { barberId, date, fromTime, durationMinutes = 30, customerId } = req.query;
    if (!barberId || !date) {
      return res.status(400).json({ message: 'Missing barberId or date' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Get real-time availability considering completed bookings
    const result = await BarberSchedule.getRealTimeAvailability(barberId, date, fromTime);

    if (!result.available) {
      return res.json(result);
    }

    // Get existing bookings for conflict checking
    const barberBookings = await Booking.find({
      barberId,
      bookingDate: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ bookingDate: 1 });

    // Get customer's existing bookings if customerId provided
    let customerBookings = [];
    if (customerId) {
      customerBookings = await Booking.find({
        customerId,
        bookingDate: {
          $gte: new Date(date + 'T00:00:00.000Z'),
          $lt: new Date(date + 'T23:59:59.999Z')
        },
        status: { $in: ['pending', 'confirmed'] }
      }).sort({ bookingDate: 1 });
    }

    // Combine all conflicting bookings
    const allConflictingBookings = [...barberBookings, ...customerBookings];

    // Filter slots based on duration and conflicts
    const filteredSlots = result.slots.filter(slot => {
      // Check if this service duration would conflict with existing bookings
      return isSlotAvailableForDuration(slot.time, parseInt(durationMinutes), allConflictingBookings, date);
    });

    // Filter out slots that are too close to current time (if today)
    let finalSlots = filteredSlots;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (date === today) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      finalSlots = filteredSlots.filter(slot => {
        const [h, m] = slot.time.split(':').map(Number);
        const slotMinutes = h * 60 + m;
        return slotMinutes - nowMinutes >= 30; // 30 minutes buffer
      });
    }

    // Convert slot objects to time strings for backward compatibility
    const timeSlots = finalSlots.map(slot => slot.time || slot);

    res.json({
      available: true,
      slots: timeSlots,
      totalSlots: result.slots.length,
      availableSlots: timeSlots.length,
      bookedSlots: barberBookings.length,
      customerConflicts: customerBookings.length,
      realTimeSync: result.realTimeSync,
      lastUpdated: result.lastUpdated,
      dynamicAvailability: true,
      fromTime: fromTime || null
    });

  } catch (err) {
    console.error('Error getting real-time availability:', err);
    res.status(500).json({ message: err.message });
  }
};

// Force release slots for a completed booking (admin endpoint)
exports.forceReleaseCompletedBookingSlots = async (req, res) => {
  try {
    const { barberId, date, bookingId, completionTime } = req.body;

    if (!barberId || !date || !bookingId) {
      return res.status(400).json({
        message: 'Missing required fields: barberId, date, bookingId'
      });
    }

    const actualCompletionTime = completionTime ? new Date(completionTime) : new Date();

    const result = await BarberSchedule.releaseCompletedBookingSlots(
      barberId,
      date,
      bookingId,
      actualCompletionTime
    );

    if (result.success) {
      res.json({
        message: 'Slots released successfully',
        result
      });
    } else {
      res.status(400).json({
        message: 'Failed to release slots',
        error: result.message
      });
    }

  } catch (err) {
    console.error('Error in forceReleaseCompletedBookingSlots:', err);
    res.status(500).json({ message: err.message });
  }
};

// Debug: Get schedule details for a barber on a specific date
exports.getScheduleDetails = async (req, res) => {
  try {
    const { barberId, date } = req.query;
    if (!barberId || !date) {
      return res.status(400).json({ message: 'Missing barberId or date' });
    }

    const schedule = await BarberSchedule.findOne({ barberId, date });

    if (!schedule) {
      return res.json({
        exists: false,
        message: 'No schedule found for this barber on this date'
      });
    }

    // Get completed bookings for this date to show dynamic availability info
    const completedBookings = await Booking.find({
      barberId,
      bookingDate: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      status: 'completed'
    }).select('_id bookingDate completedAt durationMinutes');

    res.json({
      exists: true,
      schedule: {
        barberId: schedule.barberId,
        date: schedule.date,
        workingHours: schedule.workingHours,
        isOffDay: schedule.isOffDay,
        offReason: schedule.offReason,
        slotDuration: schedule.slotDuration,
        totalSlots: schedule.availableSlots.length,
        availableSlots: schedule.availableSlots.filter(slot => !slot.isBooked && !slot.isBlocked),
        bookedSlots: schedule.availableSlots.filter(slot => slot.isBooked),
        blockedSlots: schedule.availableSlots.filter(slot => slot.isBlocked),
        breakTimes: schedule.breakTimes,
        lastUpdated: schedule.lastUpdated
      },
      completedBookings: completedBookings.map(booking => ({
        id: booking._id,
        originalTime: booking.bookingDate,
        completedAt: booking.completedAt,
        duration: booking.durationMinutes,
        earlyCompletion: booking.completedAt && booking.completedAt < new Date(booking.bookingDate.getTime() + booking.durationMinutes * 60000)
      })),
      dynamicAvailabilityEnabled: true
    });
  } catch (err) {
    console.error('Error getting schedule details:', err);
    res.status(500).json({ message: err.message });
  }
};

