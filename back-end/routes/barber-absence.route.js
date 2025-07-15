const express = require('express');
const router = express.Router();
const barberAbsenceController = require('../controllers/barber-absence.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Barber absence management (admin only)
router.post('/', authenticate, barberAbsenceController.createBarberAbsence);
router.get('/', authenticate, barberAbsenceController.getAllAbsences);
router.put('/:absenceId/approval', authenticate, barberAbsenceController.updateAbsenceApproval);
router.put('/:absenceId/reschedule', authenticate, barberAbsenceController.rescheduleAffectedBookings);
router.delete('/:absenceId', authenticate, barberAbsenceController.deleteAbsence);

// Barber calendar view
router.get('/calendar', authenticate, barberAbsenceController.getBarberCalendar);

module.exports = router;
