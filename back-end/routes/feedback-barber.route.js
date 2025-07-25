const express = require('express');
const router = express.Router();
const feedbackBarberController = require('../controllers/feedbackBarber.controller');

router.get('/', feedbackBarberController.getAllFeedbacks);
router.get('/:id', feedbackBarberController.getBarberFeedbackById);
router.post('/', feedbackBarberController.createBarberFeedback);
router.delete('/:id', feedbackBarberController.deleteBarberFeedback);
router.patch('/:id/status', feedbackBarberController.updateFeedbackStatus);

router.get('/booking/:bookingId', feedbackBarberController.getByBookingId);

module.exports = router; 