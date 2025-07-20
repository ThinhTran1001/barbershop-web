const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/productreview.controller');

// POST - Create new review
router.post('/', reviewController.createReview);

// GET - All reviews
router.get('/', reviewController.getAllReviews);

// GET - Reviews by productId
router.get('/product/:productId', reviewController.getReviewsByProduct);



// DELETE - Delete review
router.delete('/:id', reviewController.deleteReview);



module.exports = router;
