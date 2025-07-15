const Booking = require('../models/booking.model');
const mongoose = require('mongoose');

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
      customerId: req.userId, 
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

    const bookings = await Booking.find(filter);

    res.status(200).json(bookings);
  } catch (err) {
    console.error('Error in getAllBookings:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId')
      .populate({ path: 'barberId', populate: { path: 'userId' } })
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
