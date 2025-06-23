const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discounts.controller');

// Routes for discounts
router.post('/', discountController.createDiscount);
router.get('/', discountController.getAllDiscounts);
router.get('/:id', discountController.getDiscountById);
router.put('/:id', discountController.updateDiscount);
router.delete('/:id', discountController.deleteDiscount);

module.exports = router;