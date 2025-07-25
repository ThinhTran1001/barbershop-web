const BarberSchedule = require('../models/barber-schedule.model');
const Booking = require('../models/booking.model');

/**
 * Utility to sync barber schedules with existing bookings
 * This helps fix any inconsistencies between schedule slots and booking records
 */

/**
 * Sync a specific barber's schedule for a specific date
 * @param {string} barberId - The barber's ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} - Sync results
 */
async function syncBarberScheduleForDate(barberId, date) {
  try {
    // Get or create the schedule for this date
    let schedule = await BarberSchedule.findOne({ barberId, date });
    
    if (!schedule) {
      schedule = new BarberSchedule({
        barberId,
        date,
        workingHours: { start: "09:00", end: "18:00" }
      });
      schedule.generateDefaultSlots();
      await schedule.save();
    }

    // Get all active bookings for this barber on this date
    const activeBookings = await Booking.find({
      barberId,
      bookingDate: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Reset all slots to available first
    schedule.availableSlots.forEach(slot => {
      slot.isBooked = false;
      slot.bookingId = null;
    });

    let syncedSlots = 0;
    let errors = [];

    // Mark slots as booked based on active bookings
    for (const booking of activeBookings) {
      try {
        const bookingStartTime = new Date(booking.bookingDate);
        const startTimeStr = bookingStartTime.toTimeString().substring(0, 5);
        
        // Calculate which slots need to be marked as booked
        const slotsToBook = calculateSlotsForDuration(startTimeStr, booking.durationMinutes, schedule.slotDuration);
        
        for (const slotTime of slotsToBook) {
          const slotIndex = schedule.availableSlots.findIndex(slot => slot.time === slotTime);
          
          if (slotIndex !== -1) {
            schedule.availableSlots[slotIndex].isBooked = true;
            schedule.availableSlots[slotIndex].bookingId = booking._id;
            syncedSlots++;
          } else {
            errors.push(`Slot ${slotTime} not found for booking ${booking._id}`);
          }
        }
      } catch (error) {
        errors.push(`Error processing booking ${booking._id}: ${error.message}`);
      }
    }

    // Save the updated schedule
    schedule.lastUpdated = new Date();
    await schedule.save();

    return {
      success: true,
      barberId,
      date,
      totalBookings: activeBookings.length,
      syncedSlots,
      errors
    };

  } catch (error) {
    return {
      success: false,
      barberId,
      date,
      error: error.message
    };
  }
}

/**
 * Sync all schedules for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} - Array of sync results for each barber
 */
async function syncAllSchedulesForDate(date) {
  const Barber = require('../models/barber.model');
  
  // Get all active barbers
  const barbers = await Barber.find({ isActive: true });
  
  const results = [];
  
  for (const barber of barbers) {
    const result = await syncBarberScheduleForDate(barber._id, date);
    results.push(result);
  }
  
  return results;
}

/**
 * Helper function to calculate which time slots are needed for a service duration
 * (Duplicated from BarberSchedule model for utility independence)
 */
function calculateSlotsForDuration(startTime, durationMinutes, slotDuration = 30) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  let remainingDuration = durationMinutes;

  while (remainingDuration > 0) {
    const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    slots.push(timeStr);
    
    // Move to next slot
    currentMinute += slotDuration;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
    
    remainingDuration -= slotDuration;
  }

  return slots;
}

/**
 * Validate schedule consistency for a specific barber and date
 * @param {string} barberId - The barber's ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} - Validation results
 */
async function validateScheduleConsistency(barberId, date) {
  try {
    const schedule = await BarberSchedule.findOne({ barberId, date });
    
    if (!schedule) {
      return {
        valid: false,
        message: 'Schedule not found',
        issues: ['Schedule does not exist for this date']
      };
    }

    const activeBookings = await Booking.find({
      barberId,
      bookingDate: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    const issues = [];
    
    // Check if all booked slots have corresponding bookings
    const bookedSlots = schedule.availableSlots.filter(slot => slot.isBooked);
    for (const slot of bookedSlots) {
      if (slot.bookingId) {
        const booking = activeBookings.find(b => b._id.toString() === slot.bookingId.toString());
        if (!booking) {
          issues.push(`Slot ${slot.time} is marked as booked but no active booking found`);
        }
      } else {
        issues.push(`Slot ${slot.time} is marked as booked but has no bookingId`);
      }
    }

    // Check if all active bookings have corresponding booked slots
    for (const booking of activeBookings) {
      const bookingStartTime = new Date(booking.bookingDate);
      const startTimeStr = bookingStartTime.toTimeString().substring(0, 5);
      const requiredSlots = calculateSlotsForDuration(startTimeStr, booking.durationMinutes);
      
      for (const slotTime of requiredSlots) {
        const slot = schedule.availableSlots.find(s => s.time === slotTime);
        if (!slot || !slot.isBooked || slot.bookingId?.toString() !== booking._id.toString()) {
          issues.push(`Booking ${booking._id} requires slot ${slotTime} but it's not properly marked as booked`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      barberId,
      date,
      totalBookings: activeBookings.length,
      totalBookedSlots: bookedSlots.length,
      issues
    };

  } catch (error) {
    return {
      valid: false,
      barberId,
      date,
      error: error.message
    };
  }
}

module.exports = {
  syncBarberScheduleForDate,
  syncAllSchedulesForDate,
  validateScheduleConsistency
};
