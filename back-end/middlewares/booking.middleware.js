const User = require('../models/user.model');
const Barber = require('../models/barber.model');

/**
 * Middleware to apply role-based booking filters
 * - Barbers can only see confirmed bookings
 * - Admins can see all bookings
 * - Customers can see their own bookings (all statuses)
 */
exports.applyRoleBasedBookingFilter = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userRole = req.role;

    // Initialize booking filter object
    req.bookingFilter = {};

    switch (userRole) {
      case 'barber':
        // Barbers can only see confirmed bookings assigned to them
        const barber = await Barber.findOne({ userId });
        if (!barber) {
          return res.status(404).json({ message: 'Barber profile not found' });
        }
        req.bookingFilter = {
          barberId: barber._id,
          status: 'confirmed'
        };
        break;

      case 'admin':
        // Admins can see all bookings (no additional filter)
        // req.bookingFilter remains empty object
        break;

      case 'customer':
        // Customers can see their own bookings (all statuses)
        req.bookingFilter = {
          customerId: userId
        };
        break;

      default:
        return res.status(403).json({ message: 'Invalid user role' });
    }

    next();
  } catch (error) {
    console.error('Error in applyRoleBasedBookingFilter:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can confirm bookings (admin only)
 */
exports.requireAdminForBookingConfirmation = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Only administrators can confirm bookings' 
    });
  }
  next();
};

/**
 * Middleware to check if user can update booking status
 * - Admins can update any booking status
 * - Barbers can only update status of confirmed bookings assigned to them
 * - Customers can only cancel their own pending bookings
 */
exports.checkBookingUpdatePermission = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const userId = req.userId;
    const userRole = req.role;

    const Booking = require('../models/booking.model');
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    switch (userRole) {
      case 'admin':
        // Admins can update any booking
        break;

      case 'barber':
        // Barbers can only update confirmed bookings assigned to them
        const barber = await Barber.findOne({ userId });
        if (!barber || booking.barberId.toString() !== barber._id.toString()) {
          return res.status(403).json({ 
            message: 'You can only update bookings assigned to you' 
          });
        }
        
        // Barbers can only see and update confirmed bookings
        if (booking.status !== 'confirmed') {
          return res.status(403).json({ 
            message: 'You can only update confirmed bookings' 
          });
        }
        
        // Barbers can only mark bookings as completed or no_show
        if (!['completed', 'no_show'].includes(status)) {
          return res.status(403).json({ 
            message: 'Barbers can only mark bookings as completed or no-show' 
          });
        }
        break;

      case 'customer':
        // Customers can only cancel their own pending bookings
        if (booking.customerId.toString() !== userId) {
          return res.status(403).json({ 
            message: 'You can only update your own bookings' 
          });
        }
        
        if (status !== 'cancelled') {
          return res.status(403).json({ 
            message: 'Customers can only cancel bookings' 
          });
        }
        
        if (booking.status !== 'pending') {
          return res.status(403).json({ 
            message: 'You can only cancel pending bookings' 
          });
        }
        break;

      default:
        return res.status(403).json({ message: 'Invalid user role' });
    }

    // Store booking in request for use in controller
    req.booking = booking;
    next();
  } catch (error) {
    console.error('Error in checkBookingUpdatePermission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
