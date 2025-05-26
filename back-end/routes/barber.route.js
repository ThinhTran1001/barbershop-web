const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barber.controller');

router.post('/barbers', barberController.createBarber);
router.get('/barbers', barberController.getAllBarber);
router.get('/barbers/:id', barberController.getSingleBarber);
router.put('/barbers/:id', barberController.updateBarber);
router.delete('/barbers', barberController.deleteBarber);

module.exports = router;