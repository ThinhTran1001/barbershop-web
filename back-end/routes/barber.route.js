const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barber.controller');

router.post('/', barberController.createBarber);       
router.get('/', barberController.getAllBarbers);      
router.get('/:id', barberController.getBarberById);  
router.put('/:id', barberController.updateBarber);      
router.delete('/:id', barberController.deleteBarber);     
router.get('/by-specialty', barberController.getBarbersBySpecialty);
router.get('/:barberId/bookings', barberController.getBarberBookings);

module.exports = router;
