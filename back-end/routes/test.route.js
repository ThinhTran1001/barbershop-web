const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const barberController = require('../controllers/barber.controller');

// Test endpoints for debugging auto-assign logic
router.get('/barbers/realtime-booking-count', barberController.testRealTimeBookingCount);
router.post('/barbers/auto-assign-verification', barberController.testAutoAssignWithVerification);
router.post('/barbers/auto-assign', barberController.testAutoAssign);
router.post('/bookings/booking-flow-auto-assign', bookingController.testBookingFlowAutoAssign);

module.exports = router;
