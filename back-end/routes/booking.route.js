const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const {
  applyRoleBasedBookingFilter,
  requireAdminForBookingConfirmation,
  checkBookingUpdatePermission
} = require('../middlewares/booking.middleware');

// Booking CRUD operations
router.post('/', authenticate, bookingController.createBooking);
router.get('/me', authenticate, applyRoleBasedBookingFilter, bookingController.getMyBookings);
router.get('/all', authenticate, applyRoleBasedBookingFilter, bookingController.getAllBookings);
router.get('/stats', authenticate, bookingController.getBookingStats);
router.get('/chart-stats', bookingController.getBookingChartStats);
router.get('/:id', authenticate, bookingController.getBookingDetail);

// Admin-only booking management
router.get('/pending/list', authenticate, authorizeRoles('admin'), bookingController.getPendingBookings);
router.put('/:bookingId/confirm', authenticate, requireAdminForBookingConfirmation, bookingController.confirmBooking);
router.post('/bulk-confirm', authenticate, requireAdminForBookingConfirmation, bookingController.bulkConfirmBookings);

// Booking status management
router.put('/:bookingId/status', authenticate, checkBookingUpdatePermission, bookingController.updateBookingStatus);
router.put('/:bookingId/cancel', authenticate, bookingController.cancelBooking);
router.put('/:bookingId', authenticate, checkBookingUpdatePermission, bookingController.updateBookingDetails);

// Booking conflict checking
router.post('/check-availability', authenticate, bookingController.checkAvailability);
router.get('/conflicts', authenticate, bookingController.getBookingConflicts);

module.exports = router;
