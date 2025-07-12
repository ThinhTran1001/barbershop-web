// routes/feedbackBooking.route.js
const express = require('express');
const router = express.Router();
const feedbackBookingController = require('../controllers/feedbackBooking.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/', authenticate, feedbackBookingController.createFeedbackBooking);
router.put('/:bookingId', authenticate, feedbackBookingController.updateFeedbackBooking);
router.get('/:bookingId', authenticate, feedbackBookingController.getFeedbackBookingByBookingId);

module.exports = router;