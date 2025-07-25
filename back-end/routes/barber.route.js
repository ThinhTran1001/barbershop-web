const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barber.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

// Barber CRUD operations
router.post('/', authenticate,barberController.createBarber);
// router.get('/', authenticate,barberController.getAllBarbers);
router.get('/', barberController.getAllBarbers);
router.get('/:id', authorizeRoles("admin"),authenticate,barberController.getBarberById);
router.put('/:id', authenticate,barberController.updateBarber);
router.delete('/:id', authenticate,barberController.deleteBarber);

// Barber filtering and search
router.get('/by-specialty', barberController.getBarbersBySpecialty);
router.post('/auto-assign', barberController.autoAssignBarber);
router.get('/availability', barberController.getBarberAvailability);
router.get('/available', authenticate, authorizeRoles('admin'), barberController.getAvailableBarbers);

// Barber bookings (with role-based access control)
router.get('/:userId/bookings', authenticate, barberController.getBarberBookings);
router.get('/:barberId/bookings', authenticate, barberController.getBarberBookings);
router.get("/by-user/:userId", barberController.getBarberByUserId);
router.get("/public/:id", barberController.getBarberPublicById);

module.exports = router;
