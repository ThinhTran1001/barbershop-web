const express = require('express');
const router = express.Router();
const statisticController = require('../controllers/statistic.controller');

router.get('/dashboard', statisticController.getDashboardStats);
router.get('/revenue', statisticController.getRevenueStats);
router.get('/orders', statisticController.getOrderStats);
router.get('/bookings', statisticController.getBookingStats);
router.get('/users', statisticController.getUserStats);
router.get('/top-products', statisticController.getTopProducts);

module.exports = router;
