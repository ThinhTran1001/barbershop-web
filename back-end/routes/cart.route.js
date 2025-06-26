const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', authenticate, cartController.getCart);

router.post('/', authenticate, cartController.addItem);

router.put('/', authenticate, cartController.updateItem);

router.delete('/:id', authenticate, cartController.removeItem);
router.delete('/', authenticate, cartController.clearCart);

module.exports = router;
