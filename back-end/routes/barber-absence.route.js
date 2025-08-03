const express = require('express');
const router = express.Router();
const barberAbsenceController = require('../controllers/barber-absence.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

// Barber routes (barbers can create and view their own requests)
router.post('/', authenticate, authorizeRoles('barber'), barberAbsenceController.createBarberAbsence);
router.get('/my-requests', authenticate, authorizeRoles('barber'), barberAbsenceController.getMyAbsenceRequests);

// Admin routes (admins can view all, approve/reject, manage)
router.get('/', authenticate, authorizeRoles('admin'), barberAbsenceController.getAllAbsences);
router.put('/:absenceId/approval', authenticate, authorizeRoles('admin'), barberAbsenceController.updateAbsenceApproval);
router.get('/:absenceId/affected-bookings', authenticate, authorizeRoles('admin'), barberAbsenceController.getAffectedBookings);
router.put('/:absenceId/process-approval', authenticate, authorizeRoles('admin'), barberAbsenceController.processAbsenceApproval);
router.get('/:absenceId/debug-dates', authenticate, authorizeRoles('admin'), barberAbsenceController.debugDateHandling);
router.put('/:absenceId/reschedule', authenticate, authorizeRoles('admin'), barberAbsenceController.rescheduleAffectedBookings);
router.put('/:absenceId/reassign-bookings', authenticate, authorizeRoles('admin'), barberAbsenceController.reassignAffectedBookings);
router.delete('/:absenceId', authenticate, authorizeRoles('admin'), barberAbsenceController.deleteAbsence);

// Calendar views (accessible by both barbers and admins)
router.get('/calendar', authenticate, authorizeRoles('barber', 'admin'), barberAbsenceController.getBarberCalendar);
router.get('/:barberId/schedule', authenticate, authorizeRoles('barber', 'admin'), barberAbsenceController.getBarberSchedule);

module.exports = router;
