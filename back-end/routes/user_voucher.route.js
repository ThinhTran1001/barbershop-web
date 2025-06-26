const express = require('express');
const router = express.Router();
const controller = require('../controllers/user_voucher.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// GET all user voucher assignments
router.get('/', authenticate, controller.getAllUserVouchers);

// POST - Assign a voucher to a user
router.post('/', authenticate, controller.assignVoucherToUser);

// GET a single assignment by ID (optional, but good practice)
router.get('/:id', authenticate, controller.getUserVoucherById);

// PUT - Update an assignment (e.g., to mark as used)
router.put('/:id', authenticate, controller.updateUserVoucher);

// DELETE - Remove a voucher assignment from a user
router.delete('/:id',  authenticate,controller.deleteUserVoucher);

module.exports = router;
