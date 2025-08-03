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
      // Admins can see all bookings except cancelled and rejected for calendar view
      // This helps keep the calendar clean and focused on active bookings
      query.status = { $in: ['pending', 'confirmed', 'completed', 'no_show'] };
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

    const { date, timeSlot, serviceId } = req.query;

    if (!date) {

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
      const barberName = barber.userId?.name;
      console.log(`\n🔍 Checking barber: ${barberName} for date: ${date}`);

      // Check if barber is absent on this date
      const bookingDateObj = timeSlot
        ? new Date(`${date}T${timeSlot}:00.000Z`)
        : new Date(`${date}T00:00:00.000Z`);

      console.log(`📅 Booking date object: ${bookingDateObj.toISOString()}`);

      // Debug: Check for any absence records (all, not just approved)
      const allAbsences = await BarberAbsence.find({
        barberId: barber._id
      });

      console.log(`📋 ${barberName} - All absence records:`,
        allAbsences.map(a => ({
          _id: a._id,
          startDate: a.startDate,
          endDate: a.endDate,
          isApproved: a.isApproved,
          reason: a.reason,
          startDateType: typeof a.startDate,
          endDateType: typeof a.endDate
        }))
      );

      // Check approved absences only
      const isAbsent = await BarberAbsence.isBarberAbsent(barber._id, bookingDateObj);
      console.log(`❓ ${barberName} - isAbsent (approved only): ${isAbsent}`);

      if (isAbsent) {
        console.log(`❌ ${barberName} - Filtered out due to approved absence`);
        continue;
      } else {
        console.log(`✅ ${barberName} - Passed absence check`);
      }

      // Special debug for Lê Quang Vinh
      if (barberName && barberName.includes('Vinh')) {
        console.log(`🔍 SPECIAL DEBUG for ${barberName}:`);
        console.log(`  - Barber ID: ${barber._id}`);
        console.log(`  - Date checking: ${date}`);
        console.log(`  - All absences count: ${allAbsences.length}`);
        console.log(`  - Approved absences:`, allAbsences.filter(a => a.isApproved));
        console.log(`  - isAbsent result: ${isAbsent}`);
      }

      // Check if barber has a schedule for this date
      const schedule = await BarberSchedule.findOne({
        barberId: barber._id,
        date: date
      });

      console.log(`📅 ${barberName} - Schedule check:`, {
        hasSchedule: !!schedule,
        scheduleId: schedule?._id,
        isOffDay: schedule?.isOffDay,
        offReason: schedule?.offReason
      });

      // If no schedule exists, barber is potentially available
      if (!schedule) {
        console.log(`✅ ${barberName} - Added to available list (no schedule)`);
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
        console.log(`❌ ${barberName} - Filtered out (off day)`, {
          isOffDay: schedule.isOffDay,
          offReason: schedule.offReason,
          absenceId: schedule.absenceId
        });

        // Special debug for Lê Quang Vinh
        if (barberName && barberName.includes('Vinh')) {
          console.log(`🔍 VINH OFF DAY DEBUG:`, {
            scheduleId: schedule._id,
            date: schedule.date,
            isOffDay: schedule.isOffDay,
            offReason: schedule.offReason,
            absenceId: schedule.absenceId,
            workingHours: schedule.workingHours
          });
        }
        continue;
      }

      // If no specific timeSlot is provided, just check if barber is generally available for the date
      if (!timeSlot) {
        console.log(`✅ ${barber.userId?.name} - Added to available list (no specific time slot)`);
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
      const slot = schedule.availableSlots?.find(slot => slot.time === timeSlot);
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

    console.log(`\n📋 FINAL RESULT for ${date} ${timeSlot ? `at ${timeSlot}` : ''}:`);
    console.log(`✅ Available barbers: ${availableBarbers.map(b => b.name).join(', ')}`);
    console.log(`📊 Total: ${availableBarbers.length} barbers`);

    res.json({
      success: true,
      availableBarbers,
      date,
      timeSlot,
      total: availableBarbers.length,
      message: availableBarbers.length > 0
        ? `Found ${availableBarbers.length} available barber(s) for ${date} at ${timeSlot || 'any time'}`
        : `No barbers available for ${date} at ${timeSlot || 'any time'}`
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

    console.log(`🔍 Found ${barbers.length} barbers eligible for auto-assignment:`,
      barbers.map(b => b.userId?.name));

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

    // Calculate current month start and end dates
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    for (const barber of barbers) {
      console.log(`\n🔍 Checking barber: ${barber.userId?.name}`);

      // Check if barber is absent on this date
      const bookingDateObj = new Date(`${date}T${timeSlot}:00.000Z`);
      const isAbsent = await BarberAbsence.isBarberAbsent(barber._id, bookingDateObj);
      if (isAbsent) {
        console.log(`❌ ${barber.userId?.name}: Absent on this date`);
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
          console.log(`❌ ${barber.userId?.name}: Off day`);
          continue;
        }

        // Check if the specific time slot is available
        const slot = schedule.timeSlots?.find(slot => slot.time === timeSlot);
        if (slot && slot.isBooked) {
          console.log(`❌ ${barber.userId?.name}: Time slot ${timeSlot} already booked`);
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
        console.log(`❌ ${barber.userId?.name}: Has existing booking at ${timeSlot}`);
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
        console.log(`❌ ${barber.userId?.name}: Daily booking limit reached (${dailyBookings}/${barber.maxDailyBookings || 10})`);
        continue;
      }

      // Calculate monthly bookings (excluding cancelled/rejected/no_show)
      const monthlyBookings = await Booking.countDocuments({
        barberId: barber._id,
        bookingDate: {
          $gte: currentMonthStart,
          $lte: currentMonthEnd
        },
        status: { $nin: ['cancelled', 'rejected', 'no_show'] }
      });

      // Also get all bookings for debugging
      const allMonthlyBookings = await Booking.find({
        barberId: barber._id,
        bookingDate: {
          $gte: currentMonthStart,
          $lte: currentMonthEnd
        }
      }).select('status bookingDate');

      console.log(`📊 Barber ${barber.userId?.name}: Monthly bookings = ${monthlyBookings}`, {
        barberId: barber._id,
        currentMonthStart: currentMonthStart.toISOString(),
        currentMonthEnd: currentMonthEnd.toISOString(),
        monthlyBookings,
        allBookings: allMonthlyBookings.map(b => ({
          status: b.status,
          date: b.bookingDate.toISOString()
        }))
      });

      // Calculate availability score for auto-assignment
      const maxDailyBookings = barber.maxDailyBookings || 10;
      const workloadScore = (maxDailyBookings - dailyBookings) / maxDailyBookings; // Higher is better (less busy)
      const ratingScore = (barber.averageRating || 0) / 5; // Normalize to 0-1
      const experienceScore = Math.min((barber.experienceYears || 0) / 10, 1); // Cap at 10 years

      // Weighted scoring: 40% rating, 30% workload, 20% experience, 10% total bookings (inverse)
      const totalBookingsScore = Math.max(0, 1 - ((barber.totalBookings || 0) / 1000)); // Inverse score for total bookings
      const finalScore = (ratingScore * 0.4) + (workloadScore * 0.3) + (experienceScore * 0.2) + (totalBookingsScore * 0.1);

      console.log(`✅ ${barber.userId?.name}: Eligible for auto-assignment`);

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
        monthlyBookings: monthlyBookings,
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

    // NEW LOGIC: Check if monthly bookings are equal or different
    const monthlyBookingCounts = eligibleBarbers.map(b => b.monthlyBookings);
    const minMonthlyBookings = Math.min(...monthlyBookingCounts);
    const maxMonthlyBookings = Math.max(...monthlyBookingCounts);
    const hasEqualMonthlyBookings = minMonthlyBookings === maxMonthlyBookings;

    console.log('📊 Monthly Booking Analysis:', {
      eligibleBarbers: eligibleBarbers.map(b => ({
        name: b.name,
        monthlyBookings: b.monthlyBookings,
        availabilityScore: b.availabilityScore
      })),
      monthlyBookingCounts,
      minMonthlyBookings,
      maxMonthlyBookings,
      hasEqualMonthlyBookings
    });

    let selectedBarber;

    if (hasEqualMonthlyBookings) {
      if (minMonthlyBookings === 0) {
        // All barbers have 0 bookings -> use round-robin based on barber ID to ensure fairness
        console.log('📊 All barbers have 0 monthly bookings, using round-robin selection');
        eligibleBarbers.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));

        // Simple round-robin: use current hour to determine selection
        const currentHour = new Date().getHours();
        const selectedIndex = currentHour % eligibleBarbers.length;
        selectedBarber = eligibleBarbers[selectedIndex];
        console.log(`✅ Selected by round-robin (hour ${currentHour} % ${eligibleBarbers.length}): ${selectedBarber.name}`);
      } else {
        // All barbers have equal monthly bookings (> 0) -> use original scoring algorithm
        console.log(`📊 All barbers have equal monthly bookings (${minMonthlyBookings} each), using original scoring algorithm`);
        eligibleBarbers.sort((a, b) => b.availabilityScore - a.availabilityScore);
        selectedBarber = eligibleBarbers[0];
        console.log(`✅ Selected by scoring: ${selectedBarber.name} (score: ${selectedBarber.availabilityScore})`);
      }
    } else {
      // Different monthly bookings -> prioritize barbers with fewer monthly bookings
      console.log('📊 Different monthly bookings detected, prioritizing barbers with fewer bookings');
      console.log(`🎯 Minimum monthly bookings: ${minMonthlyBookings}`);

      // Filter barbers with minimum monthly bookings
      const barbersWithMinBookings = eligibleBarbers.filter(b => b.monthlyBookings === minMonthlyBookings);

      console.log('🔍 Barbers with minimum bookings:', barbersWithMinBookings.map(b => ({
        name: b.name,
        monthlyBookings: b.monthlyBookings,
        availabilityScore: b.availabilityScore
      })));

      if (barbersWithMinBookings.length === 1) {
        // Only one barber with minimum bookings
        selectedBarber = barbersWithMinBookings[0];
        console.log(`✅ Selected (only one with min bookings): ${selectedBarber.name}`);
      } else {
        // Multiple barbers with same minimum bookings -> use original scoring among them
        barbersWithMinBookings.sort((a, b) => b.availabilityScore - a.availabilityScore);
        selectedBarber = barbersWithMinBookings[0];
        console.log(`✅ Selected by scoring among min booking barbers: ${selectedBarber.name} (score: ${selectedBarber.availabilityScore})`);
      }
    }

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
        monthlyBookings: selectedBarber.monthlyBookings,
        hasEqualMonthlyBookings: hasEqualMonthlyBookings,
        reason: hasEqualMonthlyBookings
          ? 'Auto-assigned based on rating, availability, and workload distribution (equal monthly bookings)'
          : `Auto-assigned based on monthly booking distribution (${selectedBarber.monthlyBookings} bookings this month)`
      },
      alternativeBarbers: eligibleBarbers
        .filter(b => b._id !== selectedBarber._id)
        .slice(0, 3)
        .map(barber => ({
          _id: barber._id,
          name: barber.name,
          averageRating: barber.averageRating,
          availabilityScore: barber.availabilityScore,
          monthlyBookings: barber.monthlyBookings
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

// Debug endpoint to check monthly bookings for all barbers
exports.debugMonthlyBookings = async (req, res) => {
  try {
    const Booking = require('../models/booking.model');

    // Calculate current month start and end dates
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    console.log('📅 Debug Monthly Bookings:', {
      currentDate: currentDate.toISOString(),
      currentMonthStart: currentMonthStart.toISOString(),
      currentMonthEnd: currentMonthEnd.toISOString()
    });

    // Get all barbers
    const barbers = await Barber.find({
      isAvailable: true,
      autoAssignmentEligible: true
    }).populate('userId', 'name email');

    const results = [];

    for (const barber of barbers) {
      // Get all bookings for this barber in current month
      const allBookings = await Booking.find({
        barberId: barber._id,
        bookingDate: {
          $gte: currentMonthStart,
          $lte: currentMonthEnd
        }
      }).select('status bookingDate');

      const monthlyBookings = await Booking.countDocuments({
        barberId: barber._id,
        bookingDate: {
          $gte: currentMonthStart,
          $lte: currentMonthEnd
        },
        status: { $nin: ['cancelled', 'rejected', 'no_show'] }
      });

      results.push({
        barberId: barber._id,
        name: barber.userId?.name,
        monthlyBookings,
        allBookingsThisMonth: allBookings.length,
        bookingDetails: allBookings.map(b => ({
          status: b.status,
          date: b.bookingDate
        }))
      });
    }

    res.json({
      success: true,
      currentMonth: {
        start: currentMonthStart,
        end: currentMonthEnd
      },
      barbers: results
    });

  } catch (error) {
    console.error('Error debugging monthly bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to debug monthly bookings',
      error: error.message
    });
  }
};

// Test endpoint to force auto-assign with detailed logging
exports.testAutoAssign = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Date and timeSlot are required'
      });
    }

    console.log(`\n🧪 TESTING AUTO-ASSIGN for ${date} at ${timeSlot}`);
    console.log('='.repeat(60));

    // Call the auto-assign function
    const result = await exports.autoAssignBarberForSlot({
      body: { date, timeSlot, serviceId: null }
    }, {
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ ...data, statusCode: code }) })
    });

    res.json({
      success: true,
      message: 'Test completed, check console logs',
      result
    });

  } catch (error) {
    console.error('Error in test auto-assign:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
};

// Test endpoint to verify absence logic
exports.testAbsenceLogic = async (req, res) => {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json({
        success: false,
        message: 'barberId and date are required'
      });
    }

    const BarberAbsence = require('../models/barber-absence.model');
    const bookingDateObj = new Date(`${date}T00:00:00.000Z`);

    // Get all absence records for this barber and date
    const allAbsences = await BarberAbsence.find({
      barberId: barberId,
      startDate: { $lte: bookingDateObj },
      endDate: { $gte: bookingDateObj }
    });

    // Check approved absences only
    const isAbsent = await BarberAbsence.isBarberAbsent(barberId, bookingDateObj);

    // Get barber info
    const barber = await Barber.findById(barberId).populate('userId', 'name');

    res.json({
      success: true,
      barber: {
        _id: barberId,
        name: barber?.userId?.name || 'Unknown'
      },
      date,
      allAbsences: allAbsences.map(a => ({
        _id: a._id,
        startDate: a.startDate,
        endDate: a.endDate,
        isApproved: a.isApproved,
        reason: a.reason,
        description: a.description
      })),
      isAbsentApprovedOnly: isAbsent,
      message: `Found ${allAbsences.length} absence record(s), ${allAbsences.filter(a => a.isApproved).length} approved`
    });

  } catch (error) {
    console.error('Error testing absence logic:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to test absence logic'
    });
  }
};

// Debug endpoint for absence issues
exports.debugAbsenceIssues = async (req, res) => {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json({
        success: false,
        message: 'barberId and date are required'
      });
    }

    const BarberAbsence = require('../models/barber-absence.model');
    const Barber = require('../models/barber.model');

    // Get barber info
    const barber = await Barber.findById(barberId).populate('userId', 'name');
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    // Get all absences for this barber
    const allAbsences = await BarberAbsence.find({ barberId });

    // Test date parsing
    const bookingDateObj = new Date(`${date}T10:00:00.000Z`);
    const dateStr = bookingDateObj.toISOString().split('T')[0];

    // Test isBarberAbsent
    const isAbsent = await BarberAbsence.isBarberAbsent(barberId, bookingDateObj);

    // Manual check
    const manualCheck = allAbsences.filter(absence => {
      if (!absence.isApproved) return false;

      const startDateStr = absence.startDate;
      const endDateStr = absence.endDate;

      return dateStr >= startDateStr && dateStr <= endDateStr;
    });

    res.json({
      success: true,
      barber: {
        _id: barberId,
        name: barber.userId?.name
      },
      date,
      dateStr,
      bookingDateObj: bookingDateObj.toISOString(),
      allAbsences: allAbsences.map(a => ({
        _id: a._id,
        startDate: a.startDate,
        endDate: a.endDate,
        isApproved: a.isApproved,
        reason: a.reason,
        startDateType: typeof a.startDate,
        endDateType: typeof a.endDate
      })),
      isAbsentResult: isAbsent,
      manualCheckResult: manualCheck.length > 0,
      manualCheckAbsences: manualCheck.map(a => ({
        _id: a._id,
        startDate: a.startDate,
        endDate: a.endDate,
        reason: a.reason
      }))
    });

  } catch (error) {
    console.error('Error debugging absence issues:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to debug absence issues'
    });
  }
};

// Debug specific barber availability
exports.debugBarberAvailability = async (req, res) => {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json({
        success: false,
        message: 'barberId and date are required'
      });
    }

    const BarberAbsence = require('../models/barber-absence.model');
    const BarberSchedule = require('../models/barber-schedule.model');

    // Get barber info
    const barber = await Barber.findById(barberId).populate('userId', 'name');
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    // Check absence
    const bookingDateObj = new Date(`${date}T10:00:00.000Z`);
    const allAbsences = await BarberAbsence.find({ barberId });
    const isAbsent = await BarberAbsence.isBarberAbsent(barberId, bookingDateObj);

    // Check schedule
    const schedule = await BarberSchedule.findOne({
      barberId: barberId,
      date: date
    });

    // Check if would be available
    let wouldBeAvailable = true;
    let filterReason = null;

    if (isAbsent) {
      wouldBeAvailable = false;
      filterReason = 'approved_absence';
    } else if (schedule?.isOffDay) {
      wouldBeAvailable = false;
      filterReason = 'off_day';
    }

    res.json({
      success: true,
      barber: {
        _id: barberId,
        name: barber.userId?.name
      },
      date,
      allAbsences: allAbsences.map(a => ({
        _id: a._id,
        startDate: a.startDate,
        endDate: a.endDate,
        isApproved: a.isApproved,
        reason: a.reason
      })),
      isAbsent,
      schedule: schedule ? {
        _id: schedule._id,
        date: schedule.date,
        isOffDay: schedule.isOffDay,
        offReason: schedule.offReason,
        absenceId: schedule.absenceId,
        workingHours: schedule.workingHours
      } : null,
      wouldBeAvailable,
      filterReason
    });

  } catch (error) {
    console.error('Error debugging barber availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to debug barber availability'
    });
  }
};

// Cleanup invalid schedule records
exports.cleanupInvalidSchedules = async (req, res) => {
  try {
    const { barberId, date } = req.query;

    if (!barberId) {
      return res.status(400).json({
        success: false,
        message: 'barberId is required'
      });
    }

    const BarberAbsence = require('../models/barber-absence.model');
    const BarberSchedule = require('../models/barber-schedule.model');

    // Get barber info
    const barber = await Barber.findById(barberId).populate('userId', 'name');
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    let query = { barberId: barberId, isOffDay: true, offReason: 'absence' };
    if (date) {
      query.date = date;
    }

    // Find all schedule records marked as off due to absence
    const scheduleRecords = await BarberSchedule.find(query);

    const cleanupResults = [];

    for (const schedule of scheduleRecords) {
      const scheduleDate = schedule.date;
      const absenceId = schedule.absenceId;

      console.log(`🔍 Checking schedule record for ${scheduleDate}:`, {
        scheduleId: schedule._id,
        absenceId,
        isOffDay: schedule.isOffDay,
        offReason: schedule.offReason
      });

      if (absenceId) {
        // Check if the absence actually covers this date
        const absence = await BarberAbsence.findById(absenceId);

        if (!absence) {
          // Absence doesn't exist, remove schedule
          await BarberSchedule.findByIdAndDelete(schedule._id);
          cleanupResults.push({
            date: scheduleDate,
            action: 'deleted',
            reason: 'absence_not_found',
            scheduleId: schedule._id,
            absenceId
          });
        } else if (!absence.isApproved) {
          // Absence not approved, remove schedule
          await BarberSchedule.findByIdAndDelete(schedule._id);
          cleanupResults.push({
            date: scheduleDate,
            action: 'deleted',
            reason: 'absence_not_approved',
            scheduleId: schedule._id,
            absenceId
          });
        } else {
          // Check if schedule date is within absence range
          const isInRange = scheduleDate >= absence.startDate && scheduleDate <= absence.endDate;

          if (!isInRange) {
            // Schedule date is outside absence range, remove it
            await BarberSchedule.findByIdAndDelete(schedule._id);
            cleanupResults.push({
              date: scheduleDate,
              action: 'deleted',
              reason: 'outside_absence_range',
              scheduleId: schedule._id,
              absenceId,
              absenceRange: `${absence.startDate} to ${absence.endDate}`
            });
          } else {
            cleanupResults.push({
              date: scheduleDate,
              action: 'kept',
              reason: 'valid_absence',
              scheduleId: schedule._id,
              absenceId,
              absenceRange: `${absence.startDate} to ${absence.endDate}`
            });
          }
        }
      } else {
        // No absenceId, but marked as absence - suspicious
        cleanupResults.push({
          date: scheduleDate,
          action: 'flagged',
          reason: 'no_absence_id',
          scheduleId: schedule._id
        });
      }
    }

    res.json({
      success: true,
      barber: {
        _id: barberId,
        name: barber.userId?.name
      },
      totalSchedulesChecked: scheduleRecords.length,
      cleanupResults,
      summary: {
        deleted: cleanupResults.filter(r => r.action === 'deleted').length,
        kept: cleanupResults.filter(r => r.action === 'kept').length,
        flagged: cleanupResults.filter(r => r.action === 'flagged').length
      }
    });

  } catch (error) {
    console.error('Error cleaning up invalid schedules:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cleanup invalid schedules'
    });
  }
};

// Fix specific schedule record
exports.fixScheduleRecord = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { action } = req.body; // 'delete' or 'update'

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: 'scheduleId is required'
      });
    }

    const BarberSchedule = require('../models/barber-schedule.model');

    const schedule = await BarberSchedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule record not found'
      });
    }

    let result;

    if (action === 'delete') {
      await BarberSchedule.findByIdAndDelete(scheduleId);
      result = {
        action: 'deleted',
        scheduleId,
        date: schedule.date
      };
    } else if (action === 'update') {
      // Reset to normal working day
      schedule.isOffDay = false;
      schedule.offReason = null;
      schedule.absenceId = null;
      await schedule.save();

      result = {
        action: 'updated',
        scheduleId,
        date: schedule.date,
        newState: {
          isOffDay: schedule.isOffDay,
          offReason: schedule.offReason,
          absenceId: schedule.absenceId
        }
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "delete" or "update"'
      });
    }

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error fixing schedule record:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fix schedule record'
    });
  }
};


