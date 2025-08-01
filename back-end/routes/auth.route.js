const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {authenticate} = require("../middlewares/auth.middleware");

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/google', authController.googleOauthHandler);

module.exports = router;