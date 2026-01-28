const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  changePassword,
  logout
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', protect, verifyOtp);
router.post('/resend-otp', protect, resendOtp);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.post('/change-password', protect, changePassword);
router.get('/logout', logout);

module.exports = router;