const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const {authenticate, authorizeRoles} = require("../middlewares/auth.middleware");

router.get('/', authenticate,cartController.getCart);
router.post('/', authenticate, cartController.addToCart);
router.put('/', authenticate, cartController.updateItemQuantity);
router.delete('/clear', authenticate, cartController.clearCart);
router.delete('/remove/:productId', authenticate, cartController.removeItem);

module.exports = router;