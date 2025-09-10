const express = require('express');
const router = express.Router();
const { signup, login, verifyOtp, resendOtp, getAllUsers, sendOtp, testTwilio } = require('../controllers/authController');

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', signup);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   POST api/auth/verify-otp
// @desc    Verify OTP
// @access  Public
router.post('/verify-otp', verifyOtp);

// @route   POST api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp', resendOtp);

// @route   POST api/auth/send-otp
// @desc    Generate and send OTP to the provided mobile number
// @access  Public
router.post('/send-otp', sendOtp);

// Test Twilio sending
router.post('/test-twilio', testTwilio);

// @route   GET api/auth/all-users
// @desc    Get all users
// @access  Public
router.get('/all-users', getAllUsers);

module.exports = router;
