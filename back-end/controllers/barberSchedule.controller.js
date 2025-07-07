const Barber = require('../models/barber.model');
const Booking = require('../models/booking.model');
const BarberSchedule = require('../models/barber-schedule.model');

// Get available time slots for a barber on a specific date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { barberId, date } = req.query;
    if (!barberId || !date) {
      return res.status(400).json({ message: 'Missing barberId or date' });
    }
    // Parse date
    const day = new Date(date);
    if (isNaN(day.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }
    // Check if barber is off on this day
    const schedule = await BarberSchedule.findOne({ barberId });
    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found for barber' });
    }
    const weekday = day.getDay(); // 0=Sunday
    if (schedule.offDays && schedule.offDays.includes(weekday)) {
      return res.json({ available: false, reason: 'Barber is off on this day', slots: [] });
    }
    // Get all slots for the day
    const allSlots = schedule.slotsByDay && schedule.slotsByDay[weekday] ? schedule.slotsByDay[weekday] : [];
    // Get booked slots for this barber on this date
    const bookings = await Booking.find({ barberId, date });
    const bookedSlots = bookings.map(b => b.timeSlot);
    // Exclude booked slots and slots within 30 minutes from now (if today)
    const now = new Date();
    let availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
    if (now.toDateString() === day.toDateString()) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      availableSlots = availableSlots.filter(slot => {
        // slot format: 'HH:mm'
        const [h, m] = slot.split(':').map(Number);
        const slotMinutes = h * 60 + m;
        return slotMinutes - nowMinutes >= 30;
      });
    }
    res.json({ available: true, slots: availableSlots });
  } catch (err) {
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
    const day = new Date(date);
    if (isNaN(day.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }
    const schedule = await BarberSchedule.findOne({ barberId });
    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found for barber' });
    }
    const weekday = day.getDay();
    const isOff = schedule.offDays && schedule.offDays.includes(weekday);
    res.json({ isOff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

