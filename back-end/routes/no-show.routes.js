const express = require('express');
const router = express.Router();
const noShowController = require('../controllers/no-show.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

// Get customer's no-show history (customer or admin)
router.get('/customers/:customerId/history', authenticate, noShowController.getCustomerNoShowHistory);

// Check customer status (blocked or not)
router.get('/customers/:customerId/status', authenticate, noShowController.checkCustomerStatus);

// Admin routes

// Get all no-shows with pagination and filters
router.get('/', noShowController.getAllNoShows);

// Get no-show statistics
router.get('/statistics', noShowController.getNoShowStatistics);

// Excuse a specific no-show
router.put('/:noShowId/excuse', noShowController.excuseNoShow);

// Reset customer's no-show count
router.put('/customers/:customerId/reset', noShowController.resetCustomerNoShows);

module.exports = router;
