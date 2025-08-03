const BarberAbsence = require('../models/barber-absence.model');
const Booking = require('../models/booking.model');
const Barber = require('../models/barber.model');
const User = require('../models/user.model');
const BarberSchedule = require('../models/barber-schedule.model');

// Create barber absence (Barber only)
exports.createBarberAbsence = async (req, res) => {
  try {
    const { startDate, endDate, reason, description } = req.body;
    const createdBy = req.userId;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        message: 'Start date, end date, and reason are required'
      });
    }

    // Validate user is a barber
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'barber') {
      return res.status(403).json({
        message: 'Only barbers can create absence requests'
      });
    }

    // Get barber profile from user
    const barber = await Barber.findOne({ userId: req.userId });
    if (!barber) {
      return res.status(404).json({
        message: 'Barber profile not found'
      });
    }

    // Validate dates - expect YYYY-MM-DD format from frontend
    console.log('📅 Creating absence with dates:', { startDate, endDate });

    // Validate YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        message: 'Invalid date format. Please provide dates in YYYY-MM-DD format.'
      });
    }

    // Parse dates for validation only (don't store as Date objects)
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    console.log('📅 Date validation:', {
        startDate,
        endDate,
        startParsed: start.toISOString(),
        endParsed: end.toISOString(),
        isValidStart: !isNaN(start.getTime()),
        isValidEnd: !isNaN(end.getTime())
    });

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: 'Invalid date values.'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        message: 'End date must be after start date'
      });
    }

    // Check for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return res.status(400).json({
        message: 'Cannot create absence request for past dates'
      });
    }

    // Create absence record (pending approval) - store dates as strings
    const absence = new BarberAbsence({
      barberId: barber._id,
      startDate: startDate, // Store as string (YYYY-MM-DD)
      endDate: endDate,     // Store as string (YYYY-MM-DD)
      reason,
      description,
      createdBy,
      isApproved: null // Always start as pending approval (null = pending)
    });

    console.log('📅 Storing absence with string dates:', {
        startDate: absence.startDate,
        endDate: absence.endDate,
        startDateType: typeof absence.startDate,
        endDateType: typeof absence.endDate
    });

    // Find affected bookings
    const affectedBookings = await absence.findAffectedBookings();
    
    if (affectedBookings.length > 0) {
      absence.affectedBookings = affectedBookings.map(booking => ({
        bookingId: booking._id,
        originalDate: booking.bookingDate,
        status: 'pending_reschedule'
      }));
    }

    await absence.save();

    res.status(201).json({
      message: 'Absence request submitted successfully. Awaiting admin approval.',
      absence: {
        _id: absence._id,
        startDate: absence.startDate,
        endDate: absence.endDate,
        reason: absence.reason,
        description: absence.description,
        isApproved: absence.isApproved,
        createdAt: absence.createdAt
      },
      affectedBookingsCount: affectedBookings.length,
      affectedBookings: affectedBookings.map(booking => ({
        id: booking._id,
        customerName: booking.customerId.name,
        serviceName: booking.serviceId.name,
        originalDate: booking.bookingDate
      }))
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all barber absences
exports.getAllAbsences = async (req, res) => {
  try {
    const { 
      barberId, 
      startDate, 
      endDate, 
      reason,
      isApproved,
      page = 1, 
      limit = 20 
    } = req.query;

    const filter = {};
    
    if (barberId) filter.barberId = barberId;
    if (reason) filter.reason = reason;
    if (isApproved !== undefined) {
      if (isApproved === 'true') filter.isApproved = true;
      else if (isApproved === 'false') filter.isApproved = false;
      else if (isApproved === 'null' || isApproved === 'pending') filter.isApproved = null;
    }
    
    if (startDate || endDate) {
      filter.$or = [];
      if (startDate) {
        filter.$or.push({ startDate: { $gte: new Date(startDate) } });
        filter.$or.push({ endDate: { $gte: new Date(startDate) } });
      }
      if (endDate) {
        filter.$or.push({ startDate: { $lte: new Date(endDate) } });
        filter.$or.push({ endDate: { $lte: new Date(endDate) } });
      }
    }

    const skip = (page - 1) * limit;
    const absences = await BarberAbsence.find(filter)
      .populate('barberId', 'userId specialties')
      .populate({
        path: 'barberId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Populate affected bookings with complete customer and service information
    const populatedAbsences = await Promise.all(
      absences.map(async (absence) => {
        if (absence.affectedBookings && absence.affectedBookings.length > 0) {
          const populatedBookings = await Promise.all(
            absence.affectedBookings.map(async (affectedBooking) => {
              try {
                // Find the actual booking document
                const booking = await Booking.findById(affectedBooking.bookingId)
                  .populate('customerId', 'name email phone')
                  .populate('serviceId', 'name duration price description')
                  .select('bookingDate status specialRequests notes createdAt');

                if (booking) {
                  return {
                    bookingId: affectedBooking.bookingId,
                    customerName: booking.customerId?.name || 'Unknown Customer',
                    customerPhone: booking.customerId?.phone || null,
                    customerEmail: booking.customerId?.email || null,
                    serviceName: booking.serviceId?.name || 'Unknown Service',
                    serviceDuration: booking.serviceId?.duration || null,
                    servicePrice: booking.serviceId?.price || null,
                    serviceDescription: booking.serviceId?.description || null,
                    originalDate: booking.bookingDate,
                    status: booking.status,
                    specialRequests: booking.specialRequests || booking.notes || null,
                    createdAt: booking.createdAt,
                    // Include original affected booking data
                    ...affectedBooking.toObject()
                  };
                } else {
                  // If booking not found, return original data with fallbacks
                  return {
                    bookingId: affectedBooking.bookingId,
                    customerName: 'Booking Not Found',
                    customerPhone: null,
                    customerEmail: null,
                    serviceName: 'Unknown Service',
                    serviceDuration: null,
                    servicePrice: null,
                    serviceDescription: null,
                    originalDate: affectedBooking.originalDate || new Date(),
                    status: 'unknown',
                    specialRequests: null,
                    createdAt: new Date(),
                    ...affectedBooking.toObject()
                  };
                }
              } catch (error) {
                console.error(`Error populating booking ${affectedBooking.bookingId}:`, error);
                // Return fallback data on error
                return {
                  bookingId: affectedBooking.bookingId,
                  customerName: 'Error Loading Customer',
                  customerPhone: null,
                  customerEmail: null,
                  serviceName: 'Error Loading Service',
                  serviceDuration: null,
                  servicePrice: null,
                  serviceDescription: null,
                  originalDate: affectedBooking.originalDate || new Date(),
                  status: 'error',
                  specialRequests: null,
                  createdAt: new Date(),
                  ...affectedBooking.toObject()
                };
              }
            })
          );

          // Return absence with populated bookings
          return {
            ...absence.toObject(),
            affectedBookings: populatedBookings
          };
        } else {
          // Return absence as-is if no affected bookings
          return absence.toObject();
        }
      })
    );

    const total = await BarberAbsence.countDocuments(filter);

    res.json({
      absences: populatedAbsences,
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

// Get barber's own absence requests (Barber only)
exports.getMyAbsenceRequests = async (req, res) => {
  try {
    // Validate user is a barber
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'barber') {
      return res.status(403).json({
        message: 'Only barbers can access their own absence requests'
      });
    }

    // Get barber profile from user
    const barber = await Barber.findOne({ userId: req.userId });
    if (!barber) {
      return res.status(404).json({
        message: 'Barber profile not found'
      });
    }

    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter = { barberId: barber._id };

    // Filter by approval status if provided
    if (status === 'pending') filter.isApproved = null;
    if (status === 'approved') filter.isApproved = true;
    if (status === 'rejected') filter.isApproved = false;

    // Filter by date range if provided
    if (startDate || endDate) {
      filter.$or = [];
      if (startDate) {
        filter.$or.push({ startDate: { $gte: new Date(startDate) } });
        filter.$or.push({ endDate: { $gte: new Date(startDate) } });
      }
      if (endDate) {
        filter.$or.push({ startDate: { $lte: new Date(endDate) } });
        filter.$or.push({ endDate: { $lte: new Date(endDate) } });
      }
    }

    const skip = (page - 1) * limit;
    const absences = await BarberAbsence.find(filter)
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await BarberAbsence.countDocuments(filter);

    res.json({
      absences,
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

// Update absence approval status
exports.updateAbsenceApproval = async (req, res) => {
  try {
    const { absenceId } = req.params;
    const { isApproved } = req.body;
    const approvedBy = req.userId;

    // Validate user is admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can approve/reject absence requests'
      });
    }

    const absence = await BarberAbsence.findById(absenceId);
    if (!absence) {
      return res.status(404).json({
        message: 'Absence record not found'
      });
    }

    const wasApproved = absence.isApproved;
    absence.isApproved = isApproved;

    if (isApproved) {
      absence.approvedBy = approvedBy;

      // Update barber schedules when approving
      try {
        await absence.updateBarberSchedules();
        console.log(`Absence approved: Updated schedules for barber ${absence.barberId} from ${absence.startDate} to ${absence.endDate}`);
      } catch (scheduleError) {
        console.error('Error updating barber schedules:', scheduleError);
        // Continue with approval even if schedule update fails
      }
    } else if (wasApproved && !isApproved) {
      // Revert schedules if previously approved and now rejected
      try {
        await absence.revertBarberSchedules();
        console.log(`Absence rejected: Reverted schedules for barber ${absence.barberId} from ${absence.startDate} to ${absence.endDate}`);
      } catch (scheduleError) {
        console.error('Error reverting barber schedules:', scheduleError);
        // Continue with rejection even if schedule revert fails
      }
    }

    await absence.save();

    res.json({
      absence,
      message: `Absence ${isApproved ? 'approved' : 'rejected'} successfully`,
      scheduleUpdated: true
    });

  } catch (err) {
    console.error('Error updating absence approval:', err);
    res.status(500).json({
      message: err.message || 'Failed to update absence approval',
      scheduleUpdated: false
    });
  }
};

// Get affected bookings for absence approval
exports.getAffectedBookings = async (req, res) => {
  try {
    const { absenceId } = req.params;

    // Validate user is admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can view affected bookings'
      });
    }

    const absence = await BarberAbsence.findById(absenceId)
      .populate('barberId', 'userId')
      .populate({
        path: 'barberId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    if (!absence) {
      return res.status(404).json({
        message: 'Absence record not found'
      });
    }

    // Get all bookings for this barber during the absence period
    const Booking = require('../models/booking.model');

    // Convert string dates to Date objects for MongoDB query
    const startDate = new Date(absence.startDate + 'T00:00:00');
    const endDate = new Date(absence.endDate + 'T23:59:59');

    console.log('📅 Querying affected bookings:', {
      startDateStr: absence.startDate,
      endDateStr: absence.endDate,
      startDateObj: startDate.toISOString(),
      endDateObj: endDate.toISOString()
    });

    const affectedBookings = await Booking.find({
      barberId: absence.barberId._id,
      bookingDate: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $nin: ['rejected', 'cancelled'] }
    })
    .populate('customerId', 'name email phone')
    .populate('serviceId', 'name durationMinutes price')
    .sort({ bookingDate: 1 });

    res.json({
      success: true,
      absence: {
        _id: absence._id,
        barberId: absence.barberId._id,
        barberName: absence.barberId.userId.name,
        startDate: absence.startDate,
        endDate: absence.endDate,
        reason: absence.reason,
        description: absence.description
      },
      affectedBookings: affectedBookings.map(booking => ({
        _id: booking._id,
        customerId: booking.customerId._id,
        customerName: booking.customerId.name,
        customerEmail: booking.customerId.email,
        customerPhone: booking.customerId.phone,
        serviceId: booking.serviceId._id,
        serviceName: booking.serviceId.name,
        serviceDuration: booking.serviceId.durationMinutes,
        servicePrice: booking.serviceId.price,
        bookingDate: booking.bookingDate,
        status: booking.status,
        note: booking.note,
        reassignedFrom: booking.reassignedFrom,
        reassignedAt: booking.reassignedAt
      }))
    });

  } catch (err) {
    console.error('Error getting affected bookings:', err);
    res.status(500).json({
      message: err.message || 'Failed to get affected bookings'
    });
  }
};

// Process absence approval with booking reassignments/rejections
exports.processAbsenceApproval = async (req, res) => {
  try {
    const { absenceId } = req.params;
    const { bookingActions } = req.body; // Array of { bookingId, action: 'reassign'|'reject', newBarberId? }
    const approvedBy = req.userId;

    // Validate user is admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can process absence approval'
      });
    }

    if (!bookingActions || !Array.isArray(bookingActions)) {
      return res.status(400).json({
        message: 'Booking actions array is required'
      });
    }

    const absence = await BarberAbsence.findById(absenceId);
    if (!absence) {
      return res.status(404).json({
        message: 'Absence record not found'
      });
    }

    const Booking = require('../models/booking.model');
    const BarberSchedule = require('../models/barber-schedule.model');
    const results = [];

    // Process each booking action
    for (const action of bookingActions) {
      try {
        const booking = await Booking.findById(action.bookingId);
        if (!booking) {
          results.push({
            bookingId: action.bookingId,
            success: false,
            message: 'Booking not found'
          });
          continue;
        }

        if (action.action === 'reassign') {
          if (!action.newBarberId) {
            results.push({
              bookingId: action.bookingId,
              success: false,
              message: 'New barber ID is required for reassignment'
            });
            continue;
          }

          // Reassign booking
          const oldBarberId = booking.barberId;
          booking.barberId = action.newBarberId;
          booking.reassignedFrom = oldBarberId;
          booking.reassignedAt = new Date();
          booking.reassignedBy = approvedBy;
          await booking.save();

          // Update schedules
          const bookingDate = new Date(booking.bookingDate);
          const dateStr = bookingDate.toISOString().split('T')[0];
          const startTimeStr = bookingDate.toTimeString().substring(0, 5);

          // Get service duration
          const Service = require('../models/service.model');
          const service = await Service.findById(booking.serviceId);
          const durationMinutes = service ? service.durationMinutes : 30;

          // Free up slots for old barber
          try {
            await BarberSchedule.unmarkSlotsAsBooked(
              oldBarberId,
              dateStr,
              booking._id,
              null
            );
          } catch (unmaskError) {
            console.error('Error freeing slots for old barber:', unmaskError);
          }

          // Mark slots for new barber
          try {
            await BarberSchedule.markSlotsAsBooked(
              action.newBarberId,
              dateStr,
              startTimeStr,
              durationMinutes,
              booking._id,
              null
            );
          } catch (markError) {
            console.error('Error marking slots for new barber:', markError);
          }

          results.push({
            bookingId: action.bookingId,
            success: true,
            action: 'reassigned',
            newBarberId: action.newBarberId
          });

        } else if (action.action === 'reject') {
          // Reject booking with proper rejection data
          booking.status = 'rejected';
          booking.rejectedAt = new Date();
          booking.rejectedBy = approvedBy;
          booking.rejectionReason = action.rejectionReason || 'barber_unavailable';
          booking.rejectionNote = action.rejectionNote || 'Booking rejected due to approved barber absence';
          await booking.save();

          console.log(`📋 Rejected booking ${booking._id}:`, {
            customerId: booking.customerId,
            serviceId: booking.serviceId,
            bookingDate: booking.bookingDate,
            rejectionReason: booking.rejectionReason,
            rejectionNote: booking.rejectionNote
          });

          // Free up schedule slots
          const bookingDate = new Date(booking.bookingDate);
          const dateStr = bookingDate.toISOString().split('T')[0];

          try {
            await BarberSchedule.unmarkSlotsAsBooked(
              booking.barberId,
              dateStr,
              booking._id,
              null
            );
          } catch (unmaskError) {
            console.error('Error freeing slots for rejected booking:', unmaskError);
          }

          results.push({
            bookingId: action.bookingId,
            success: true,
            action: 'rejected'
          });
        }

      } catch (actionError) {
        console.error(`Error processing action for booking ${action.bookingId}:`, actionError);
        results.push({
          bookingId: action.bookingId,
          success: false,
          message: actionError.message
        });
      }
    }

    // Now approve the absence
    absence.isApproved = true;
    absence.approvedBy = approvedBy;
    absence.approvedAt = new Date();

    // Update barber schedules for absence period
    try {
      await absence.updateBarberSchedules();
      console.log(`Absence approved: Updated schedules for barber ${absence.barberId} from ${absence.startDate} to ${absence.endDate}`);
    } catch (scheduleError) {
      console.error('Error updating barber schedules:', scheduleError);
    }

    await absence.save();

    res.json({
      success: true,
      message: 'Absence approved and bookings processed successfully',
      absence,
      bookingResults: results,
      processedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length
    });

  } catch (err) {
    console.error('Error processing absence approval:', err);
    res.status(500).json({
      message: err.message || 'Failed to process absence approval'
    });
  }
};

// Debug endpoint to test date handling
exports.debugDateHandling = async (req, res) => {
  try {
    const { absenceId } = req.params;

    const absence = await BarberAbsence.findById(absenceId);
    if (!absence) {
      return res.status(404).json({
        success: false,
        message: 'Absence not found'
      });
    }

    // Test date conversion
    let startDateStr, endDateStr;

    if (absence.startDate instanceof Date) {
        startDateStr = absence.startDate.toISOString().split('T')[0];
    } else {
        startDateStr = absence.startDate;
    }

    if (absence.endDate instanceof Date) {
        endDateStr = absence.endDate.toISOString().split('T')[0];
    } else {
        endDateStr = absence.endDate;
    }

    // Generate date range
    const dates = [];
    const currentDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(endDateStr + 'T00:00:00');

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Test isBarberAbsent for each date
    const testResults = [];
    for (const dateStr of dates) {
        const testDate = new Date(dateStr + 'T10:00:00'); // Test at 10 AM
        const isAbsent = await BarberAbsence.isBarberAbsent(absence.barberId, testDate);
        testResults.push({
            date: dateStr,
            testDate: testDate.toISOString(),
            isAbsent
        });
    }

    res.json({
      success: true,
      absence: {
        _id: absence._id,
        startDate: absence.startDate,
        endDate: absence.endDate,
        isApproved: absence.isApproved
      },
      dateConversion: {
        originalStartDate: absence.startDate,
        originalEndDate: absence.endDate,
        startDateStr,
        endDateStr,
        startDateType: typeof absence.startDate,
        endDateType: typeof absence.endDate
      },
      generatedDates: dates,
      testResults
    });

  } catch (err) {
    console.error('Error debugging date handling:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to debug date handling'
    });
  }
};

// Reschedule affected bookings
exports.rescheduleAffectedBookings = async (req, res) => {
  try {
    const { absenceId } = req.params;
    const { reschedulingOptions } = req.body; // Array of { bookingId, newDate, newBarberId }

    const absence = await BarberAbsence.findById(absenceId);
    if (!absence) {
      return res.status(404).json({ message: 'Absence record not found' });
    }

    const results = [];

    for (const option of reschedulingOptions) {
      const { bookingId, newDate, newBarberId } = option;
      
      try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          results.push({ bookingId, status: 'error', message: 'Booking not found' });
          continue;
        }

        if (newDate) {
          booking.bookingDate = new Date(newDate);
        }
        
        if (newBarberId) {
          booking.barberId = newBarberId;
        }

        await booking.save();

        // Update absence record
        const affectedBooking = absence.affectedBookings.find(
          ab => ab.bookingId.toString() === bookingId
        );
        if (affectedBooking) {
          affectedBooking.newDate = newDate ? new Date(newDate) : undefined;
          affectedBooking.newBarberId = newBarberId;
          affectedBooking.status = 'rescheduled';
        }

        results.push({ 
          bookingId, 
          status: 'success', 
          message: 'Booking rescheduled successfully' 
        });

      } catch (error) {
        results.push({ 
          bookingId, 
          status: 'error', 
          message: error.message 
        });
      }
    }

    await absence.save();

    res.json({
      message: 'Rescheduling process completed',
      results
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete absence record
exports.deleteAbsence = async (req, res) => {
  try {
    const { absenceId } = req.params;

    const absence = await BarberAbsence.findById(absenceId);
    if (!absence) {
      return res.status(404).json({ message: 'Absence record not found' });
    }

    // Check if there are unresolved affected bookings
    const unresolvedBookings = absence.affectedBookings.filter(
      booking => booking.status === 'pending_reschedule'
    );

    if (unresolvedBookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete absence with unresolved affected bookings',
        unresolvedCount: unresolvedBookings.length
      });
    }

    await BarberAbsence.findByIdAndDelete(absenceId);

    res.json({ message: 'Absence record deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get barber availability calendar
exports.getBarberCalendar = async (req, res) => {
  try {
    const { userId, month, year } = req.query;

    if (!userId || !month || !year) {
      return res.status(400).json({
        message: 'User ID, month, and year are required'
      });
    }

    // Find the barber record using userId
    const barber = await Barber.findOne({ userId: userId });
    if (!barber) {
      return res.status(404).json({
        message: 'Barber profile not found for this user'
      });
    }

    const barberId = barber._id;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get absences for the month using barberId
    const absences = await BarberAbsence.getBarberAbsences(barberId, startDate, endDate);

    // Get bookings for the month using barberId
    const bookings = await Booking.find({
      barberId: barberId,
      bookingDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed', 'cancelled'] }
    }).select('bookingDate durationMinutes status');

    // Generate calendar
    const calendar = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if barber is absent using string comparison (no timezone issues)
      const isAbsent = absences.some(absence => {
        // Since absence dates are now stored as strings (YYYY-MM-DD), compare directly
        const absenceStart = absence.startDate;
        const absenceEnd = absence.endDate;

        const isInRange = dateStr >= absenceStart && dateStr <= absenceEnd;

        console.log(`📅 Checking absence for ${dateStr}:`, {
          absenceStart,
          absenceEnd,
          dateStr,
          isInRange
        });

        return isInRange;
      });

      // Count bookings for this date
      const dayBookings = bookings.filter(booking => 
        booking.bookingDate.toISOString().split('T')[0] === dateStr
      );

      // Find absence reason using string comparison
      let absenceReason = null;
      if (isAbsent) {
        const matchingAbsence = absences.find(absence => {
          // Since absence dates are now strings, compare directly
          return dateStr >= absence.startDate && dateStr <= absence.endDate;
        });
        absenceReason = matchingAbsence?.reason || null;

        console.log(`📅 ${dateStr} absence check:`, {
          isAbsent,
          matchingAbsence: matchingAbsence ? {
            startDate: matchingAbsence.startDate,
            endDate: matchingAbsence.endDate,
            reason: matchingAbsence.reason
          } : null,
          absenceReason
        });
      }

      calendar.push({
        date: dateStr,
        isAbsent,
        absenceReason,
        bookingsCount: dayBookings.length,
        totalBookedMinutes: dayBookings.reduce((sum, booking) =>
          sum + booking.durationMinutes, 0
        )
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      userId,
      barberId,
      month: Number(month),
      year: Number(year),
      calendar,
      absences: absences.map(absence => ({
        startDate: absence.startDate,
        endDate: absence.endDate,
        reason: absence.reason,
        description: absence.description
      }))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBarberSchedule = async (req, res) => {
  try {
    const { month, year } = req.query;
    const barberId  = req.params.barberId;
    console.log('barberId', barberId);

    if (!barberId || !month || !year) {
      return res.status(400).json({
        message: 'barber ID, month, and year are required'
      });
    }

  

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get absences for the month using barberId
    const absences = await BarberAbsence.getBarberAbsences(barberId, startDate, endDate);

    // Get bookings for the month using barberId
    const bookings = await Booking.find({
      barberId: barberId,
      bookingDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed', 'cancelled'] }
    }).select('bookingDate durationMinutes status');

    // Generate calendar
    const calendar = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if barber is absent using string comparison (no timezone issues)
      const isAbsent = absences.some(absence => {
        // Since absence dates are now stored as strings (YYYY-MM-DD), compare directly
        const absenceStart = absence.startDate;
        const absenceEnd = absence.endDate;

        const isInRange = dateStr >= absenceStart && dateStr <= absenceEnd;

        console.log(`📅 getBarberSchedule - Checking absence for ${dateStr}:`, {
          absenceStart,
          absenceEnd,
          dateStr,
          isInRange
        });

        return isInRange;
      });

      // Count bookings for this date
      const dayBookings = bookings.filter(booking =>
        booking.bookingDate.toISOString().split('T')[0] === dateStr
      );

      // Find absence reason using string comparison
      let absenceReason = null;
      if (isAbsent) {
        const matchingAbsence = absences.find(absence => {
          // Since absence dates are now strings, compare directly
          return dateStr >= absence.startDate && dateStr <= absence.endDate;
        });
        absenceReason = matchingAbsence?.reason || null;
      }

      calendar.push({
        date: dateStr,
        isAbsent,
        absenceReason,
        bookingsCount: dayBookings.length,
        totalBookedMinutes: dayBookings.reduce((sum, booking) =>
          sum + booking.durationMinutes, 0
        )
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      barberId,
      month: Number(month),
      year: Number(year),
      calendar,
      absences: absences.map(absence => ({
        startDate: absence.startDate,
        endDate: absence.endDate,
        reason: absence.reason,
        description: absence.description
      }))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reassign affected bookings to new barbers (Admin only)
exports.reassignAffectedBookings = async (req, res) => {
  try {
    const { absenceId } = req.params;
    const { assignments } = req.body; // Array of { bookingId, newBarberId }

    // Validate user is admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can reassign bookings'
      });
    }

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        message: 'Assignments array is required'
      });
    }

    const absence = await BarberAbsence.findById(absenceId);
    if (!absence) {
      return res.status(404).json({
        message: 'Absence record not found'
      });
    }

    if (!absence.isApproved) {
      return res.status(400).json({
        message: 'Can only reassign bookings for approved absences'
      });
    }

    const results = [];
    const errors = [];

    // Process each assignment
    for (const assignment of assignments) {
      try {
        const { bookingId, newBarberId } = assignment;

        // Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          errors.push(`Booking ${bookingId} not found`);
          continue;
        }

        // Verify the booking is affected by this absence
        const isAffected = absence.affectedBookings.some(
          affected => affected.bookingId.toString() === bookingId
        );

        if (!isAffected) {
          errors.push(`Booking ${bookingId} is not affected by this absence`);
          continue;
        }

        // Verify new barber exists and is available
        const newBarber = await Barber.findById(newBarberId).populate('userId', 'name');
        if (!newBarber) {
          errors.push(`Barber ${newBarberId} not found`);
          continue;
        }

        // Update the booking
        const oldBarberId = booking.barberId;
        booking.barberId = newBarberId;
        booking.reassignedFrom = oldBarberId;
        booking.reassignedAt = new Date();
        booking.reassignedBy = req.userId;

        await booking.save();

        // Update barber schedules using the same logic as confirm booking
        try {
          const bookingDate = new Date(booking.bookingDate);
          const dateStr = bookingDate.toISOString().split('T')[0];
          const startTimeStr = bookingDate.toTimeString().substring(0, 5);

          // Get service duration for proper slot marking
          const Service = require('../models/service.model');
          const service = await Service.findById(booking.serviceId);
          const durationMinutes = service ? service.durationMinutes : 30; // Default 30 minutes

          // 1. Free up slots for the old barber (if not absent)
          // Note: If old barber is absent, their schedule is already marked as unavailable
          // We still need to unmark the slots to keep data consistent
          try {
            await BarberSchedule.unmarkSlotsAsBooked(
              oldBarberId,
              dateStr,
              booking._id,
              null // No session for standalone operation
            );
            console.log(`Freed up slots for old barber ${oldBarberId}`);
          } catch (unmaskError) {
            console.error('Error freeing slots for old barber:', unmaskError);
            // Continue even if this fails
          }

          // 2. Mark slots as booked for the new barber using the same method as confirm booking
          const scheduleResult = await BarberSchedule.markSlotsAsBooked(
            newBarberId,
            dateStr,
            startTimeStr,
            durationMinutes,
            booking._id,
            null // No session for standalone operation
          );

          console.log(`Successfully marked ${scheduleResult.totalSlotsBooked} slots as booked for new barber ${newBarberId}:`, scheduleResult.bookedSlots);
        } catch (scheduleError) {
          console.error('Error updating barber schedules:', scheduleError);
          // Continue with the reassignment even if schedule update fails
          // But log the error for debugging
        }

        results.push({
          bookingId,
          oldBarberId,
          newBarberId,
          newBarberName: newBarber.userId.name,
          customerName: booking.customerId?.name || 'Unknown',
          bookingDate: booking.bookingDate
        });

      } catch (error) {
        errors.push(`Error reassigning booking ${assignment.bookingId}: ${error.message}`);
      }
    }

    // Update the absence record to mark affected bookings as resolved
    if (results.length > 0) {
      absence.affectedBookings = absence.affectedBookings.map(affected => {
        const wasReassigned = results.some(result =>
          result.bookingId === affected.bookingId.toString()
        );

        if (wasReassigned) {
          return {
            ...affected.toObject(),
            status: 'reassigned',
            resolvedAt: new Date()
          };
        }

        return affected;
      });

      await absence.save();
    }

    res.json({
      message: `Successfully reassigned ${results.length} booking(s)`,
      successfulAssignments: results,
      errors: errors,
      totalProcessed: assignments.length,
      successCount: results.length,
      errorCount: errors.length
    });

  } catch (error) {
    console.error('Error reassigning affected bookings:', error);
    res.status(500).json({
      message: error.message || 'Failed to reassign bookings'
    });
  }
};
