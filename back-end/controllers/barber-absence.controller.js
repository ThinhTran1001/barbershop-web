const BarberAbsence = require('../models/barber-absence.model');
const Booking = require('../models/booking.model');
const Barber = require('../models/barber.model');

// Create barber absence
exports.createBarberAbsence = async (req, res) => {
  try {
    const { barberId, startDate, endDate, reason, description } = req.body;
    const createdBy = req.userId;

    if (!barberId || !startDate || !endDate || !reason) {
      return res.status(400).json({ 
        message: 'Barber ID, start date, end date, and reason are required' 
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

    // Check if barber exists
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    // Create absence record
    const absence = new BarberAbsence({
      barberId,
      startDate: start,
      endDate: end,
      reason,
      description,
      createdBy,
      isApproved: true // Auto-approve for now, can be changed to require approval
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
      absence,
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
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    
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

    const absence = await BarberAbsence.findById(absenceId);
    if (!absence) {
      return res.status(404).json({ message: 'Absence record not found' });
    }

    absence.isApproved = isApproved;
    if (isApproved) {
      absence.approvedBy = approvedBy;
    }

    await absence.save();

    res.json({
      absence,
      message: `Absence ${isApproved ? 'approved' : 'rejected'} successfully`
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
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
      status: { $in: ['pending', 'confirmed'] }
    }).select('bookingDate durationMinutes status');

    // Generate calendar
    const calendar = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if barber is absent
      const isAbsent = absences.some(absence => 
        currentDate >= absence.startDate && currentDate <= absence.endDate
      );

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
      status: { $in: ['pending', 'confirmed'] }
    }).select('bookingDate durationMinutes status');

    // Generate calendar
    const calendar = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if barber is absent
      const isAbsent = absences.some(absence => 
        currentDate >= absence.startDate && currentDate <= absence.endDate
      );

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
}
