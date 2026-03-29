const express = require('express');
const authController = require('./auth.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOtp);
router.get('/me', authController.getCurrentUser);

module.exports = router;
