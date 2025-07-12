const express = require('express');
const router = express.Router();
const feedbackBarberController = require('../controllers/feedbackBarber.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', feedbackBarberController.getAllFeedbacks);
router.get('/approved', feedbackBarberController.getApprovedFeedbacks);
router.get('/:id', feedbackBarberController.getBarberFeedbackById);

router.post('/', authenticate, feedbackBarberController.createBarberFeedback);

router.patch('/:id/approve', authenticate, feedbackBarberController.updateApprovalStatus);

router.delete('/:id', authenticate, feedbackBarberController.deleteBarberFeedback);

module.exports = router;