const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const {authenticate, authorizeRoles} = require("../middlewares/auth.middleware");

// router.post('/', authenticate, authorizeRoles('admin'), brandController.createBrand);
// router.get('/', authenticate, authorizeRoles('admin', 'user'), brandController.getAllBrands);
// router.get('/:id', authenticate, authorizeRoles('admin', 'user'), brandController.getBrandById);
// router.put('/:id', authenticate, authorizeRoles('admin'), brandController.updateBrand);
// router.delete('/:id', authenticate, authorizeRoles('admin'), brandController.deleteBrand);

router.post('/', brandController.createBrand);
router.get('/', brandController.getAllBrands);
router.get('/:id', brandController.getBrandById);
router.put('/:id', brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);

module.exports = router;