const Barber = require('../models/barber.model');
const Booking = require('../models/booking.model');
const BarberSchedule = require('../models/barber-schedule.model');
const BarberAbsence = require('../models/barber-absence.model');

exports.createBarber = async (req, res) => {
  try {
    const userId = req.user.id;

    const existingBarber = await Barber.findOne({ userId });
    if (existingBarber) {
      return res.status(400).json({ message: 'User đã có hồ sơ barber.' });
    }

    const newBarber = new Barber({
      userId,
      bio: req.body.bio,
      experienceYears: req.body.experienceYears,
      specialties: req.body.specialties,
      expertiseTags: req.body.expertiseTags || [],
      hairTypeExpertise: req.body.hairTypeExpertise || [],
      styleExpertise: req.body.styleExpertise || [],
      workingSince: req.body.workingSince,
      autoAssignmentEligible: req.body.autoAssignmentEligible ?? true,
      maxDailyBookings: req.body.maxDailyBookings || 12,
      preferredWorkingHours: {
        start: req.body.preferredWorkingHours?.start || "09:00",
        end: req.body.preferredWorkingHours?.end || "18:00"
      },
      profileImageUrl: req.body.profileImageUrl || null,
      certifications: req.body.certifications || [],
      languages: req.body.languages || ["Vietnamese"],
      // Các trường có default nên không cần gán nếu không có input:
      // averageRating, ratingCount, totalBookings, isAvailable
    });

    const savedBarber = await newBarber.save();
    res.status(201).json(savedBarber);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllBarbers = async (req, res) => {
  try {
    const {
      expertiseTags,
      hairTypeExpertise,
      styleExpertise,
      minRating,
      minExperience,
      isAvailable = true,
      autoAssignmentEligible,
      sortBy = 'averageRating',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      search // thêm search param
    } = req.query;

    // Build filter object
    const filter = { isAvailable };

    if (expertiseTags) {
      filter.expertiseTags = { $in: Array.isArray(expertiseTags) ? expertiseTags : [expertiseTags] };
    }

    if (hairTypeExpertise) {
      filter.hairTypeExpertise = { $in: Array.isArray(hairTypeExpertise) ? hairTypeExpertise : [hairTypeExpertise] };
    }

    if (styleExpertise) {
      filter.styleExpertise = { $in: Array.isArray(styleExpertise) ? styleExpertise : [styleExpertise] };
    }

    if (minRating) {
      filter.averageRating = { $gte: Number(minRating) };
    }

    if (minExperience) {
      filter.experienceYears = { $gte: Number(minExperience) };
    }

    if (autoAssignmentEligible !== undefined) {
      filter.autoAssignmentEligible = autoAssignmentEligible === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    let query = Barber.find(filter)
      .populate('userId', 'name email phone avatarUrl')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Nếu có search, filter theo tên hoặc email user
    if (search) {
      // Lấy tất cả trước, filter sau vì populate không hỗ trợ trực tiếp $regex trên field populate
      const allBarbers = await Barber.find(filter)
        .populate('userId', 'name email phone avatarUrl')
        .sort(sort);
      const searchLower = search.toLowerCase();
      const filteredBarbers = allBarbers.filter(b => {
        const name = b.userId?.name?.toLowerCase() || '';
        const email = b.userId?.email?.toLowerCase() || '';
        return name.includes(searchLower) || email.includes(searchLower);
      });
      const pagedBarbers = filteredBarbers.slice(skip, skip + Number(limit));
      return res.json({
        barbers: pagedBarbers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredBarbers.length,
          pages: Math.ceil(filteredBarbers.length / limit)
        }
      });
    }

    const barbers = await query;
    const total = await Barber.countDocuments(filter);

    res.json({
      barbers,
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

exports.getBarberById = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id).populate('userId', 'name email');
    if (!barber) return res.status(404).json({ message: 'Không tìm thấy barber' });
    res.json(barber);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBarber = async (req, res) => {
  try {
    const userId = req.user.id;

    const barber = await Barber.findOne({ userId });
    if (!barber) return res.status(404).json({ message: 'Không tìm thấy hồ sơ barber' });

    barber.bio = req.body.bio || barber.bio;
    barber.experienceYears = req.body.experienceYears || barber.experienceYears;
    barber.specialties = req.body.specialties || barber.specialties;
    barber.workingSince = req.body.workingSince || barber.workingSince;
    barber.isAvailable = req.body.isAvailable ?? barber.isAvailable;

    const updated = await barber.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBarber = async (req, res) => {
  try {
    const userId = req.user.id;

    const deleted = await Barber.findOneAndDelete({ userId });
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy hồ sơ barber' });

    res.json({ message: 'Đã xoá hồ sơ barber thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy barber giỏi nhất theo dịch vụ/specialty
exports.getBarbersBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.query;
    if (!specialty) {
      return res.status(400).json({ message: 'Missing specialty parameter' });
    }
    // Tìm các barber có specialty phù hợp, sắp xếp theo rating giảm dần
    const barbers = await Barber.find({ specialties: specialty })
      .populate('userId', 'name email')
      .sort({ rating: -1 });
    res.json(barbers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBarberBookings = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching bookings for barber with userId: ${userId}`);
    const { date, status } = req.query;
    const requestingUserRole = req.role;

    let barber = await Barber.findById(userId);
    if (!barber) {
      barber = await Barber.findOne({ userId });
    }

    const barberId = barber._id;
    const query = { barberId };

    // Apply role-based filtering
    if (requestingUserRole === 'barber') {
      // Barbers can only see confirmed bookings
      query.status = { $in: ['confirmed', 'cancelled'] };
    } else if (requestingUserRole === 'admin') {
      // Admins can see all bookings for this barber
      // No additional status filter needed
    }

    if (date) {
      // Lọc theo ngày (YYYY-MM-DD)
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.bookingDate = { $gte: start, $lte: end };
    }

    // If status is explicitly provided and user is admin, use it
    if (status && requestingUserRole === 'admin') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name price durationMinutes')
      .populate('confirmedBy', 'name email')
      .sort({ bookingDate: 1 });

    res.json({
      bookings,
      userRole: requestingUserRole
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Auto-assign barber based on service requirements and availability
exports.autoAssignBarber = async (req, res) => {
  try {
    const { serviceId, bookingDate, customerPreferences = {} } = req.body;

    if (!serviceId || !bookingDate) {
      return res.status(400).json({ message: 'Service ID and booking date are required' });
    }

    const Service = require('../models/service.model');
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Build filter for eligible barbers
    const filter = {
      isAvailable: true,
      autoAssignmentEligible: true
    };

    // Filter by service expertise requirements
    if (service.expertiseRequired && service.expertiseRequired.length > 0) {
      filter.expertiseTags = { $in: service.expertiseRequired };
    }

    // Filter by hair type expertise if provided
    if (customerPreferences.hairType) {
      filter.hairTypeExpertise = customerPreferences.hairType;
    }

    // Filter by style expertise if provided
    if (customerPreferences.stylePreference) {
      filter.styleExpertise = customerPreferences.stylePreference;
    }

    // Get eligible barbers
    let eligibleBarbers = await Barber.find(filter)
      .populate('userId', 'name email')
      .sort({ averageRating: -1, totalBookings: -1 });

    if (eligibleBarbers.length === 0) {
      // Fallback: get any available barber
      eligibleBarbers = await Barber.find({
        isAvailable: true,
        autoAssignmentEligible: true
      })
      .populate('userId', 'name email')
      .sort({ averageRating: -1 });
    }

    if (eligibleBarbers.length === 0) {
      return res.status(404).json({ message: 'No available barbers found' });
    }

    // Check availability for the requested date
    const bookingDateObj = new Date(bookingDate);
    const dateStr = bookingDateObj.toISOString().split('T')[0];

    const availableBarbers = [];

    for (const barber of eligibleBarbers) {
      // Check if barber is absent
      const isAbsent = await BarberAbsence.isBarberAbsent(barber._id, bookingDateObj);
      if (isAbsent) continue;

      // Check daily booking limit
      const dailyBookings = await Booking.countDocuments({
        barberId: barber._id,
        bookingDate: {
          $gte: new Date(dateStr + 'T00:00:00.000Z'),
          $lt: new Date(dateStr + 'T23:59:59.999Z')
        },
        status: { $in: ['pending', 'confirmed'] }
      });

      if (dailyBookings < barber.maxDailyBookings) {
        availableBarbers.push({
          ...barber.toObject(),
          currentBookings: dailyBookings,
          availabilityScore: (barber.averageRating * 0.6) +
                           ((barber.maxDailyBookings - dailyBookings) / barber.maxDailyBookings * 0.4)
        });
      }
    }

    if (availableBarbers.length === 0) {
      return res.status(404).json({ message: 'No barbers available for the selected date' });
    }

    // Sort by availability score (combination of rating and current workload)
    availableBarbers.sort((a, b) => b.availabilityScore - a.availabilityScore);

    const assignedBarber = availableBarbers[0];

    res.json({
      assignedBarber: {
        id: assignedBarber._id,
        name: assignedBarber.userId.name,
        email: assignedBarber.userId.email,
        averageRating: assignedBarber.averageRating,
        experienceYears: assignedBarber.experienceYears,
        specialties: assignedBarber.specialties,
        expertiseTags: assignedBarber.expertiseTags,
        currentBookings: assignedBarber.currentBookings,
        availabilityScore: assignedBarber.availabilityScore
      },
      alternativeBarbers: availableBarbers.slice(1, 4).map(barber => ({
        id: barber._id,
        name: barber.userId.name,
        averageRating: barber.averageRating,
        currentBookings: barber.currentBookings
      })),
      assignmentReason: 'Auto-assigned based on service requirements, rating, and availability'
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get barber availability for a specific date range
exports.getBarberAvailability = async (req, res) => {
  try {
    const { barberId, startDate, endDate } = req.query;

    if (!barberId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Barber ID, start date, and end date are required' });
    }

    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get barber absences in the date range
    const absences = await BarberAbsence.getBarberAbsences(barberId, start, end);

    // Get existing bookings in the date range
    const bookings = await Booking.find({
      barberId,
      bookingDate: { $gte: start, $lte: end },
      status: { $in: ['pending', 'confirmed'] }
    }).select('bookingDate durationMinutes');

    // Generate availability calendar
    const availability = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if barber is absent
      const isAbsent = absences.some(absence =>
        currentDate >= absence.startDate && currentDate <= absence.endDate
      );

      if (isAbsent) {
        availability.push({
          date: dateStr,
          available: false,
          reason: 'Barber is absent'
        });
      } else {
        // Count bookings for this date
        const dayBookings = bookings.filter(booking =>
          booking.bookingDate.toISOString().split('T')[0] === dateStr
        );

        const totalBookedMinutes = dayBookings.reduce((sum, booking) =>
          sum + booking.durationMinutes, 0
        );

        const maxWorkingMinutes = 8 * 60; // 8 hours
        const availableMinutes = maxWorkingMinutes - totalBookedMinutes;

        availability.push({
          date: dateStr,
          available: dayBookings.length < barber.maxDailyBookings && availableMinutes > 0,
          bookingsCount: dayBookings.length,
          maxBookings: barber.maxDailyBookings,
          bookedMinutes: totalBookedMinutes,
          availableMinutes: Math.max(0, availableMinutes)
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      barberId,
      barberName: barber.userId?.name || 'Unknown',
      dateRange: { startDate, endDate },
      availability,
      absences: absences.map(absence => ({
        startDate: absence.startDate,
        endDate: absence.endDate,
        reason: absence.reason
      }))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBarberByUserId = async (req, res) => {
  try {
    console.log('--- API CALL: /api/barbers/by-user/:userId ---');
    console.log('userId param:', req.params.userId);
    const barber = await Barber.findOne({ userId: req.params.userId }).populate('userId', 'name email phone avatarUrl');
    if (!barber) {
      console.log('Không tìm thấy barber cho userId:', req.params.userId);
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ barber cho user này' });
    }
    console.log('Barber found:', barber);
    res.json({ success: true, data: barber });
  } catch (err) {
    console.error('Lỗi khi lấy barber theo userId:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getBarberPublicById = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id)
      .populate('userId', 'name avatarUrl');
    if (!barber) {
      return res.status(404).json({ message: 'Không tìm thấy barber' });
    }
    // Chỉ trả về các trường public
    const publicData = {
      _id: barber._id,
      name: barber.userId?.name,
      avatarUrl: barber.userId?.avatarUrl,
      specialties: barber.specialties,
      experienceYears: barber.experienceYears,
      averageRating: barber.averageRating,
      totalBookings: barber.totalBookings,
      bio: barber.bio,
      image: barber.image,
      // Thêm các trường public khác nếu muốn
    };
    res.json({ success: true, data: publicData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get available barbers for specific time slot (Admin only)
exports.getAvailableBarbers = async (req, res) => {
  try {
    const { date, timeSlot, excludeBarberId } = req.query;

    if (!date || !timeSlot) {
      return res.status(400).json({
        message: 'Date and timeSlot are required'
      });
    }

    // Build filter to exclude specific barber if provided
    const filter = { isAvailable: true };
    if (excludeBarberId) {
      filter._id = { $ne: excludeBarberId };
    }

    // Get all available barbers
    const barbers = await Barber.find(filter)
      .populate('userId', 'name email')
      .select('userId specialties experienceYears averageRating');

    // Filter barbers based on schedule availability
    const availableBarbers = [];

    for (const barber of barbers) {
      // Check if barber has a schedule for this date
      const schedule = await BarberSchedule.findOne({
        barberId: barber._id,
        date: date
      });

      // If no schedule exists, barber is potentially available
      if (!schedule) {
        availableBarbers.push(barber);
        continue;
      }

      // Check if barber is not off that day
      if (schedule.isOffDay) {
        continue;
      }

      // Check if the specific time slot is available
      const slot = schedule.timeSlots.find(slot => slot.time === timeSlot);
      if (!slot || slot.isBooked) {
        continue;
      }

      // Check for existing bookings at this time
      const existingBooking = await Booking.findOne({
        barberId: barber._id,
        bookingDate: {
          $gte: new Date(`${date}T${timeSlot}:00.000Z`),
          $lt: new Date(`${date}T${timeSlot}:30.000Z`)
        },
        status: { $in: ['pending', 'confirmed'] }
      });

      if (!existingBooking) {
        availableBarbers.push(barber);
      }
    }

    res.json({
      availableBarbers,
      date,
      timeSlot,
      total: availableBarbers.length
    });

  } catch (error) {
    console.error('Error getting available barbers:', error);
    res.status(500).json({
      message: error.message || 'Failed to get available barbers'
    });
  }
};

// Get available barbers for specific time slot (Customer accessible)
exports.getAvailableBarbersForCustomers = async (req, res) => {
  try {
    console.log('getAvailableBarbersForCustomers called with:', req.query);
    const { date, timeSlot, serviceId } = req.query;

    if (!date) {
      console.log('Missing required parameter: date');
      return res.status(400).json({
        message: 'Date is required'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Validate timeSlot format (HH:MM) if provided
    if (timeSlot) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(timeSlot)) {
        return res.status(400).json({
          message: 'Invalid timeSlot format. Use HH:MM'
        });
      }
    }

    // Get all available barbers with customer-friendly information
    const barbers = await Barber.find({ isAvailable: true })
      .populate('userId', 'name email profileImageUrl')
      .select('userId specialties experienceYears averageRating totalBookings profileImageUrl autoAssignmentEligible');

    // Import required models
    const BarberSchedule = require('../models/barber-schedule.model');
    const Booking = require('../models/booking.model');
    const BarberAbsence = require('../models/barber-absence.model');

    // Filter barbers based on schedule availability
    const availableBarbers = [];

    for (const barber of barbers) {
      // Check if barber is absent on this date
      const bookingDateObj = timeSlot
        ? new Date(`${date}T${timeSlot}:00.000Z`)
        : new Date(`${date}T00:00:00.000Z`);
      const isAbsent = await BarberAbsence.isBarberAbsent(barber._id, bookingDateObj);
      if (isAbsent) {
        continue;
      }

      // Check if barber has a schedule for this date
      const schedule = await BarberSchedule.findOne({
        barberId: barber._id,
        date: date
      });

      // If no schedule exists, barber is potentially available
      if (!schedule) {
        availableBarbers.push({
          _id: barber._id,
          name: barber.userId?.name || 'Unknown',
          email: barber.userId?.email,
          profileImageUrl: barber.profileImageUrl || barber.userId?.profileImageUrl,
          specialties: barber.specialties || [],
          experienceYears: barber.experienceYears || 0,
          averageRating: barber.averageRating || 0,
          totalBookings: barber.totalBookings || 0,
          autoAssignmentEligible: barber.autoAssignmentEligible || false,
          availabilityStatus: 'available'
        });
        continue;
      }

      // Check if barber is not off that day
      if (schedule.isOffDay) {
        continue;
      }

      // If no specific timeSlot is provided, just check if barber is generally available for the date
      if (!timeSlot) {
        availableBarbers.push({
          _id: barber._id,
          name: barber.userId?.name || 'Unknown',
          email: barber.userId?.email,
          profileImageUrl: barber.profileImageUrl || barber.userId?.profileImageUrl,
          specialties: barber.specialties || [],
          experienceYears: barber.experienceYears || 0,
          averageRating: barber.averageRating || 0,
          totalBookings: barber.totalBookings || 0,
          autoAssignmentEligible: barber.autoAssignmentEligible || false,
          availabilityStatus: 'available'
        });
        continue;
      }

      // Check if the specific time slot is available
      const slot = schedule.timeSlots?.find(slot => slot.time === timeSlot);
      if (!slot || slot.isBooked) {
        continue;
      }

      // Check for existing bookings at this time
      const existingBooking = await Booking.findOne({
        barberId: barber._id,
        bookingDate: {
          $gte: new Date(`${date}T${timeSlot}:00.000Z`),
          $lt: new Date(`${date}T${timeSlot}:30.000Z`)
        },
        status: { $in: ['pending', 'confirmed'] }
      });

      if (!existingBooking) {
        availableBarbers.push({
          _id: barber._id,
          name: barber.userId?.name || 'Unknown',
          email: barber.userId?.email,
          profileImageUrl: barber.profileImageUrl || barber.userId?.profileImageUrl,
          specialties: barber.specialties || [],
          experienceYears: barber.experienceYears || 0,
          averageRating: barber.averageRating || 0,
          totalBookings: barber.totalBookings || 0,
          autoAssignmentEligible: barber.autoAssignmentEligible || false,
          availabilityStatus: 'available'
        });
      }
    }

    // Sort by rating and experience for better customer experience
    availableBarbers.sort((a, b) => {
      // Primary sort: average rating (descending)
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      // Secondary sort: experience years (descending)
      return b.experienceYears - a.experienceYears;
    });

    console.log('Returning response with', availableBarbers.length, 'barbers');
    res.json({
      success: true,
      availableBarbers,
      date,
      timeSlot,
      total: availableBarbers.length,
      message: availableBarbers.length > 0
        ? `Found ${availableBarbers.length} available barber(s) for ${date} at ${timeSlot}`
        : `No barbers available for ${date} at ${timeSlot}`
    });

  } catch (error) {
    console.error('Error getting available barbers for customers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get available barbers'
    });
  }
};

// Auto-assign best available barber for specific time slot (Customer accessible)
exports.autoAssignBarberForSlot = async (req, res) => {
  try {
    const { date, timeSlot, serviceId } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Date and timeSlot are required'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Validate timeSlot format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timeSlot format. Use HH:MM'
      });
    }

    // Get all available barbers eligible for auto-assignment
    const barbers = await Barber.find({
      isAvailable: true,
      autoAssignmentEligible: true
    })
      .populate('userId', 'name email profileImageUrl')
      .select('userId specialties experienceYears averageRating totalBookings profileImageUrl autoAssignmentEligible maxDailyBookings');

    if (barbers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No barbers available for auto-assignment'
      });
    }

    // Import required models
    const BarberSchedule = require('../models/barber-schedule.model');
    const Booking = require('../models/booking.model');
    const BarberAbsence = require('../models/barber-absence.model');

    // Filter and score barbers based on availability and performance
    const eligibleBarbers = [];

    for (const barber of barbers) {
      // Check if barber is absent on this date
      const bookingDateObj = new Date(`${date}T${timeSlot}:00.000Z`);
      const isAbsent = await BarberAbsence.isBarberAbsent(barber._id, bookingDateObj);
      if (isAbsent) {
        continue;
      }

      // Check if barber has a schedule for this date
      const schedule = await BarberSchedule.findOne({
        barberId: barber._id,
        date: date
      });

      // Check schedule availability
      let isScheduleAvailable = true;
      if (schedule) {
        // Check if barber is off that day
        if (schedule.isOffDay) {
          continue;
        }

        // Check if the specific time slot is available
        const slot = schedule.timeSlots?.find(slot => slot.time === timeSlot);
        if (slot && slot.isBooked) {
          continue;
        }
      }

      // Check for existing bookings at this time
      const existingBooking = await Booking.findOne({
        barberId: barber._id,
        bookingDate: {
          $gte: new Date(`${date}T${timeSlot}:00.000Z`),
          $lt: new Date(`${date}T${timeSlot}:30.000Z`)
        },
        status: { $in: ['pending', 'confirmed'] }
      });

      if (existingBooking) {
        continue;
      }

      // Check daily booking limit
      const dateStr = date;
      const dailyBookings = await Booking.countDocuments({
        barberId: barber._id,
        bookingDate: {
          $gte: new Date(dateStr + 'T00:00:00.000Z'),
          $lt: new Date(dateStr + 'T23:59:59.999Z')
        },
        status: { $in: ['pending', 'confirmed'] }
      });

      if (dailyBookings >= (barber.maxDailyBookings || 10)) {
        continue;
      }

      // Calculate availability score for auto-assignment
      const maxDailyBookings = barber.maxDailyBookings || 10;
      const workloadScore = (maxDailyBookings - dailyBookings) / maxDailyBookings; // Higher is better (less busy)
      const ratingScore = (barber.averageRating || 0) / 5; // Normalize to 0-1
      const experienceScore = Math.min((barber.experienceYears || 0) / 10, 1); // Cap at 10 years

      // Weighted scoring: 40% rating, 30% workload, 20% experience, 10% total bookings (inverse)
      const totalBookingsScore = Math.max(0, 1 - ((barber.totalBookings || 0) / 1000)); // Inverse score for total bookings
      const finalScore = (ratingScore * 0.4) + (workloadScore * 0.3) + (experienceScore * 0.2) + (totalBookingsScore * 0.1);

      eligibleBarbers.push({
        _id: barber._id,
        name: barber.userId?.name || 'Unknown',
        email: barber.userId?.email,
        profileImageUrl: barber.profileImageUrl || barber.userId?.profileImageUrl,
        specialties: barber.specialties || [],
        experienceYears: barber.experienceYears || 0,
        averageRating: barber.averageRating || 0,
        totalBookings: barber.totalBookings || 0,
        currentDailyBookings: dailyBookings,
        maxDailyBookings: maxDailyBookings,
        availabilityScore: finalScore,
        workloadScore,
        ratingScore,
        experienceScore
      });
    }

    if (eligibleBarbers.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No barbers available for auto-assignment on ${date} at ${timeSlot}`
      });
    }

    // Sort by availability score (highest first)
    eligibleBarbers.sort((a, b) => b.availabilityScore - a.availabilityScore);

    // Select the best available barber
    const selectedBarber = eligibleBarbers[0];

    res.json({
      success: true,
      assignedBarber: {
        _id: selectedBarber._id,
        name: selectedBarber.name,
        email: selectedBarber.email,
        profileImageUrl: selectedBarber.profileImageUrl,
        specialties: selectedBarber.specialties,
        experienceYears: selectedBarber.experienceYears,
        averageRating: selectedBarber.averageRating,
        totalBookings: selectedBarber.totalBookings
      },
      assignmentDetails: {
        date,
        timeSlot,
        availabilityScore: selectedBarber.availabilityScore,
        reason: 'Auto-assigned based on rating, availability, and workload distribution'
      },
      alternativeBarbers: eligibleBarbers.slice(1, 4).map(barber => ({
        _id: barber._id,
        name: barber.name,
        averageRating: barber.averageRating,
        availabilityScore: barber.availabilityScore
      })),
      message: `Successfully assigned ${selectedBarber.name} for ${date} at ${timeSlot}`
    });

  } catch (error) {
    console.error('Error auto-assigning barber for slot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to auto-assign barber'
    });
  }
};


