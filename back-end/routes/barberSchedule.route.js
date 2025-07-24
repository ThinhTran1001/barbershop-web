const express = require('express');
const router = express.Router();
const barberScheduleController = require('../controllers/barberSchedule.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

router.get('/available-slots', barberScheduleController.getAvailableSlots);
router.get('/is-off', barberScheduleController.isBarberOff);
router.post('/validate-availability', barberScheduleController.validateTimeSlotAvailability);

// Admin-only schedule management endpoints
router.post('/sync-schedule', authenticate, authorizeRoles('admin'), barberScheduleController.syncScheduleWithBookings);
router.get('/validate-consistency', authenticate, authorizeRoles('admin'), barberScheduleController.validateScheduleConsistency);

module.exports = router;

