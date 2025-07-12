// routes/feedbackOrder.route.js
const express = require('express');
const router = express.Router();
const feedbackOrderController = require('../controllers/feedbackOrder.controller');

router.post('/', feedbackOrderController.createFeedbackOrder);
router.put('/:orderId', feedbackOrderController.updateFeedbackOrder);
router.get('/:orderId', feedbackOrderController.getFeedbackOrderByOrderId);

module.exports = router;