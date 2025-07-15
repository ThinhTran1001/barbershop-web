const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/', authenticate, bookingController.createBooking);
router.get('/me', authenticate, bookingController.getMyBookings);
router.get('/all', authenticate, bookingController.getAllBookings);
router.get('/stats', authenticate, bookingController.getBookingStats);
router.get('/chart-stats', bookingController.getBookingChartStats);
router.get('/:id', authenticate, bookingController.getBookingDetail);

module.exports = router;
