const Booking = require('../models/booking.model');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      barberId,
      serviceId,
      bookingDate,
      durationMinutes,
      note,
      notificationMethods,
      autoAssignedBarber,
      customerName,
      customerEmail,
      customerPhone
    } = req.body;

    const booking = new Booking({
      customerId: req.userId, // Lấy từ token đã decode
      barberId,
      serviceId,
      bookingDate,
      durationMinutes,
      note,
      notificationMethods,
      autoAssignedBarber,
      customerName,
      customerEmail,
      customerPhone
    });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Lấy danh sách booking của user hiện tại
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.userId })
      .populate('serviceId')
      .populate({ path: 'barberId', populate: { path: 'userId' } });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
