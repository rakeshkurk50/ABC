const User = require('../models/User');
const { sendOtpEmail } = require('../config/email');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const otpStore = {};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const normalizeMobile = (mobile) => {
  const digits = mobile.replace(/\D/g, '');
  return digits.length === 10 ? `+91${digits}` : mobile;
};

// ----------------------
// @desc    Signup new user with OTP
// @route   POST /api/auth/signup
// ----------------------
exports.signup = async (req, res) => {
  const { firstName, lastName, email, mobile, password, loginId, country, state, city, street } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !email || !mobile || !password || !loginId || !country || !state || !city || !street) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const normalizedMobile = normalizeMobile(mobile);

    // Check for existing user
    const [existingEmail, existingMobile] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ mobile: normalizedMobile })
    ]);

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered. Please use a different email.'
      });
    }

    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is already registered. Please use a different number.'
      });
    }

    // Generate OTP first
    const code = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min

    // Send OTP email before creating user
    const emailResult = await sendOtpEmail(email, code);
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    // Create user after successful OTP email
    const user = await User.create({
      firstName,
      lastName,
      email,
      mobile: normalizedMobile,
      password,
      loginId,
      country,
      state,
      city,
      street
    });
    
    // Store OTP only after user creation is successful
    otpStore[normalizedMobile] = { code, expiresAt };

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for the verification code.'
    });
  } catch (err) {
    console.error('[signup ERROR]', err.message || err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ----------------------
// @desc    Login user (no OTP step yet)
// @route   POST /api/auth/login
// ----------------------
exports.login = async (req, res) => {
  console.log('Login attempt received:', req.body);
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const user = await User.findOne({ loginId });
    console.log('User found:', user);

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: user._id, loginId: user.loginId } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ----------------------
// @desc    Generate OTP for existing user
// @route   POST /api/auth/send-otp
// ----------------------
exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;

  try {
    const normalizedMobile = normalizeMobile(mobile);
    const user = await User.findOne({ mobile: normalizedMobile });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found with this mobile number' });
    }

    const code = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min
    otpStore[normalizedMobile] = { code, expiresAt };

    const sent = await sendOtpEmail(user.email, code);
    if (!sent) {
      return res.json({
        success: true,
        message: 'OTP generated but email not sent. Use code manually (DEV only).',
        code,
      });
    }

    return res.json({ success: true, message: 'OTP sent to your registered email' });
  } catch (err) {
    console.error('[sendOtp ERROR]', err.message || err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ----------------------
// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// ----------------------
exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  try {
    const normalizedMobile = normalizeMobile(mobile);
    const record = otpStore[normalizedMobile];

    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP generated for this number' });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[normalizedMobile];
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (record.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    delete otpStore[normalizedMobile]; // OTP consumed
    return res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('[verifyOtp ERROR]', err.message || err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ----------------------
// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// ----------------------
exports.resendOtp = async (req, res) => {
  const { mobile } = req.body;

  try {
    const normalizedMobile = normalizeMobile(mobile);
    const user = await User.findOne({ mobile: normalizedMobile });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const code = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore[normalizedMobile] = { code, expiresAt };

    const sent = await sendOtpEmail(user.email, code);
    if (!sent) {
      return res.json({
        success: true,
        message: 'OTP generated but email not sent. Use code manually (DEV only).',
        code,
      });
    }

    return res.json({ success: true, message: 'OTP resent to email' });
  } catch (err) {
    console.error('[resendOtp ERROR]', err.message || err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ----------------------
// @desc    Get all users (for testing/admin)
// @route   GET /api/auth/all-users
// ----------------------
exports.getAllUsers = async (req, res) => {
  try {
    console.log('[getAllUsers] req.user:', req.user);
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (err) {
    console.error('[getAllUsers ERROR]', err.message || err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
