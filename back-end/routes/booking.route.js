const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/', authenticate, bookingController.createBooking);
router.get('/me', authenticate, bookingController.getMyBookings);

module.exports = router;
