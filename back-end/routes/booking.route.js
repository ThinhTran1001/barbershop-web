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
router.post('/single-page', authenticate, bookingController.createBookingSinglePage);
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

// Admin booking rejection
router.put('/:bookingId/reject', authenticate, authorizeRoles('admin'), bookingController.rejectBooking);

// Barber no-show management
router.put('/:bookingId/no-show', authenticate, bookingController.markNoShow);

// Time-based completion checking
router.get('/:bookingId/completion-eligibility', authenticate, bookingController.checkCompletionEligibility);

// Booking conflict checking
router.post('/check-availability', authenticate, bookingController.checkAvailability);
router.get('/conflicts', authenticate, bookingController.getBookingConflicts);

module.exports = router;
