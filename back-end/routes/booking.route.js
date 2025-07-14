const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Booking CRUD operations
router.post('/', authenticate, bookingController.createBooking);
router.get('/me', authenticate, bookingController.getMyBookings);

// Booking status management
router.put('/:bookingId/status', authenticate, bookingController.updateBookingStatus);
router.put('/:bookingId/cancel', authenticate, bookingController.cancelBooking);

// Booking conflict checking
router.post('/check-availability', authenticate, bookingController.checkAvailability);
router.get('/conflicts', authenticate, bookingController.getBookingConflicts);

module.exports = router;
