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

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

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

    // Create absence record (pending approval)
    const absence = new BarberAbsence({
      barberId: barber._id,
      startDate: start,
      endDate: end,
      reason,
      description,
      createdBy,
      isApproved: null // Always start as pending approval (null = pending)
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

      // Check if barber is absent (compare dates only, ignore time)
      const isAbsent = absences.some(absence => {
        const absenceStart = new Date(absence.startDate);
        const absenceEnd = new Date(absence.endDate);
        const checkDate = new Date(currentDate);

        // Set all times to midnight for accurate date comparison
        absenceStart.setHours(0, 0, 0, 0);
        absenceEnd.setHours(23, 59, 59, 999);
        checkDate.setHours(12, 0, 0, 0); // Use noon to avoid timezone issues

        return checkDate >= absenceStart && checkDate <= absenceEnd;
      });

      // Count bookings for this date
      const dayBookings = bookings.filter(booking => 
        booking.bookingDate.toISOString().split('T')[0] === dateStr
      );

      calendar.push({
        date: dateStr,
        isAbsent,
        absenceReason: isAbsent ? absences.find(absence => 
          currentDate >= absence.startDate && currentDate <= absence.endDate
        )?.reason : null,
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

      // Check if barber is absent (compare dates only, ignore time)
      const isAbsent = absences.some(absence => {
        const absenceStart = new Date(absence.startDate);
        const absenceEnd = new Date(absence.endDate);
        const checkDate = new Date(currentDate);

        // Set all times to midnight for accurate date comparison
        absenceStart.setHours(0, 0, 0, 0);
        absenceEnd.setHours(23, 59, 59, 999);
        checkDate.setHours(12, 0, 0, 0); // Use noon to avoid timezone issues

        return checkDate >= absenceStart && checkDate <= absenceEnd;
      });

      // Count bookings for this date
      const dayBookings = bookings.filter(booking =>
        booking.bookingDate.toISOString().split('T')[0] === dateStr
      );

      calendar.push({
        date: dateStr,
        isAbsent,
        absenceReason: isAbsent ? absences.find(absence => {
          const absenceStart = new Date(absence.startDate);
          const absenceEnd = new Date(absence.endDate);
          const checkDate = new Date(currentDate);

          absenceStart.setHours(0, 0, 0, 0);
          absenceEnd.setHours(23, 59, 59, 999);
          checkDate.setHours(12, 0, 0, 0);

          return checkDate >= absenceStart && checkDate <= absenceEnd;
        })?.reason : null,
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
