const Barber = require('../models/barber.model');
const Booking = require('../models/booking.model');
const BarberSchedule = require('../models/barber-schedule.model');
const ScheduleInitializerService = require('../services/schedule-initializer.service');

// Get available time slots for a barber on a specific date
exports.getAvailableSlots = async (req, res) => {
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

    // Use the static method from BarberSchedule model
    const result = await BarberSchedule.getAvailableSlots(barberId, date);

    // Filter out slots that are too close to current time (if today)
    if (result.available && result.slots.length > 0) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      if (date === today) {
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        result.slots = result.slots.filter(slot => {
          const [h, m] = slot.time.split(':').map(Number);
          const slotMinutes = h * 60 + m;
          return slotMinutes - nowMinutes >= 30; // 30 minutes buffer
        });
      }

      // Convert slot objects to time strings for backward compatibility
      const timeSlots = result.slots.map(slot => slot.time);
      return res.json({ available: true, slots: timeSlots });
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

    res.json({ isOff: schedule.isOffDay || false });
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
        breakTimes: schedule.breakTimes
      }
    });
  } catch (err) {
    console.error('Error getting schedule details:', err);
    res.status(500).json({ message: err.message });
  }
};

