const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackBarber.controller');

router.get('/', feedbackController.getAllFeedbacks);
router.get('/approved', feedbackController.getApprovedFeedbacks);
router.get('/:id', feedbackController.getBarberFeedbackById);
router.post('/', feedbackController.createBarberFeedback);
router.patch('/:id/approve', feedbackController.updateApprovalStatus);
router.delete('/:id', feedbackController.deleteBarberFeedback);

module.exports = router;
