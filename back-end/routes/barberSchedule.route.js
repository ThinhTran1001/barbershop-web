const express = require('express');
const router = express.Router();
const barberScheduleController = require('../controllers/barberSchedule.controller');

router.get('/available-slots', barberScheduleController.getAvailableSlots);
router.get('/is-off', barberScheduleController.isBarberOff);

module.exports = router;

