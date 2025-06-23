const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const upload = require('../middleware/multer');
const { protect } = require('../middleware/auth');



router.post('/',userController.createUser);
router.get('/', userController.getAllUser);
router.get('/:id', userController.getSingleUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Profile routes
router.get('/profile/me', protect, userController.getProfile);
router.patch('/profile/me', protect, upload.single('profileImage'), userController.updateProfile);


module.exports = router;