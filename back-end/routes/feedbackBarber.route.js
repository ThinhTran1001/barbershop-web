const express = require('express');
const router = express.Router();
const feedbackBarberController = require('../controllers/feedbackBarber.controller');

router.get('/', feedbackBarberController.getAllFeedbacks);
router.get('/approved', feedbackBarberController.getApprovedFeedbacks);
router.get('/:id', feedbackBarberController.getBarberFeedbackById);

router.post('/', feedbackBarberController.createBarberFeedback);

router.patch('/:id/approve', feedbackBarberController.updateApprovalStatus);

router.delete('/:id', feedbackBarberController.deleteBarberFeedback);

module.exports = router;