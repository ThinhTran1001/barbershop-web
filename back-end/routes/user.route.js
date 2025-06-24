const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const upload = require('../config/multer');

router.post('/',userController.createUser);[]
router.get('/', userController.getAllUser);
router.get('/:id', userController.getSingleUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Profile routes
router.get('/profile/me',userController.getProfile);
router.patch('/profile/me',upload.single('profileImage'), userController.updateProfile);


module.exports = router;