const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const upload = require('../middleware/multer')

router.post('/users',userController.createUser);
router.get('/users', userController.getAllUser);
router.get('/users/:id', userController.getSingleUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users', userController.deleteUser);

module.exports = router;