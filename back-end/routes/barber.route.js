const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barber.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

// Specific routes MUST come before parameterized routes
// Barber filtering and search
router.get('/by-specialty', barberController.getBarbersBySpecialty);
router.post('/auto-assign', barberController.autoAssignBarber);
router.get('/availability', barberController.getBarberAvailability);
// Test route to verify barber routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Barber routes are working!', timestamp: new Date().toISOString() });
});
router.get('/available-for-customers', barberController.getAvailableBarbersForCustomers);
router.get('/available', authenticate, barberController.getAvailableBarbers);
router.post('/auto-assign-for-slot', barberController.autoAssignBarberForSlot);
router.get('/debug-monthly-bookings', barberController.debugMonthlyBookings);
router.get('/debug-total-bookings', barberController.debugTotalBookings);
router.get('/quick-check-total-bookings', barberController.quickCheckTotalBookings);
router.post('/fix-total-bookings', barberController.fixTotalBookings);
router.post('/test-auto-assign', barberController.testAutoAssign);
router.post('/test-auto-assign-verification', barberController.testAutoAssignWithVerification);
router.get('/test-realtime-booking-count', barberController.testRealTimeBookingCount);
router.get('/test-absence-logic', barberController.testAbsenceLogic);
router.get('/debug-absence-issues', barberController.debugAbsenceIssues);
router.get('/debug-barber-availability', barberController.debugBarberAvailability);
router.get('/cleanup-invalid-schedules', barberController.cleanupInvalidSchedules);
router.put('/fix-schedule/:scheduleId', barberController.fixScheduleRecord);

// Barber bookings (with role-based access control)
router.get('/:userId/bookings', authenticate, barberController.getBarberBookings);
router.get('/:barberId/bookings', authenticate, barberController.getBarberBookings);
router.get("/by-user/:userId", barberController.getBarberByUserId);
router.get("/public/:id", barberController.getBarberPublicById);

// Barber CRUD operations (parameterized routes come last)
router.post('/', authenticate,barberController.createBarber);
// router.get('/', authenticate,barberController.getAllBarbers);
router.get('/', barberController.getAllBarbers);
router.get('/:id', authenticate, authorizeRoles("admin"), barberController.getBarberById);
router.put('/:id', authenticate,barberController.updateBarber);
router.delete('/:id', authenticate,barberController.deleteBarber);

module.exports = router;
