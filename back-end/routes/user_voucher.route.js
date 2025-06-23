const express = require('express');
const router = express.Router();
const controller = require('../controllers/user_voucher.controller');

// GET all user voucher assignments
router.get('/', controller.getAllUserVouchers);

// POST - Assign a voucher to a user
router.post('/', controller.assignVoucherToUser);

// GET a single assignment by ID (optional, but good practice)
router.get('/:id', controller.getUserVoucherById);

// PUT - Update an assignment (e.g., to mark as used)
router.put('/:id', controller.updateUserVoucher);

// DELETE - Remove a voucher assignment from a user
router.delete('/:id', controller.deleteUserVoucher);

module.exports = router;
