const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barber.controller');

// Barber CRUD operations
router.post('/', barberController.createBarber);
router.get('/', barberController.getAllBarbers);
router.get('/:id', barberController.getBarberById);
router.put('/:id', barberController.updateBarber);
router.delete('/:id', barberController.deleteBarber);

// Barber filtering and search
router.get('/by-specialty', barberController.getBarbersBySpecialty);
router.post('/auto-assign', barberController.autoAssignBarber);
router.get('/availability', barberController.getBarberAvailability);

// Barber bookings
router.get('/:barberId/bookings', barberController.getBarberBookings);

module.exports = router;
