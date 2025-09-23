const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  signup,
  login,
  verifyOtp,
  resendOtp,
  getAllUsers,
  sendOtp,
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/all-users', protect, getAllUsers);

module.exports = router;
