const express = require('express');
const router = express.Router();
const bookingFeedbackController = require('../controllers/booking-feedback.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Create feedback for a booking
router.post('/', authenticate, bookingFeedbackController.createBookingFeedback);

// Get feedback for a specific booking
router.get('/booking/:bookingId', authenticate, bookingFeedbackController.getBookingFeedback);

// Get all feedback for a barber
router.get('/barber/:barberId', bookingFeedbackController.getBarberFeedback);

// Get all feedback for a service
router.get('/service/:serviceId', bookingFeedbackController.getServiceFeedback);

// Update feedback (within 7 days)
router.put('/:feedbackId', authenticate, bookingFeedbackController.updateBookingFeedback);

// Mark feedback as helpful/unhelpful
router.post('/:feedbackId/helpful', authenticate, bookingFeedbackController.markFeedbackHelpful);

// Add business response to feedback
router.post('/:feedbackId/response', authenticate, bookingFeedbackController.addBusinessResponse);

// Get customer's feedback history
router.get('/my-feedback', authenticate, bookingFeedbackController.getCustomerFeedback);

module.exports = router;
