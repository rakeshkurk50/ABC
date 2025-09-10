const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const twilio = require('twilio');

// Twilio client initialized lazily so tests/dev without credentials won't crash
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('[AUTH] Twilio client initialized');
}

// Temporary in-memory OTP store for trial (phone -> { code, expiresAt })
// NOTE: This is NOT suitable for production. Use Redis or a DB for persistence.
const otpStore = {};

// Temporary in-memory signup store for users who started signup but haven't
// completed OTP verification yet. Maps mobile -> { userData, code, expiresAt }
const signupStore = {};

function normalizeMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return mobile;
  const trimmed = mobile.trim();
  if (/^[0-9]{10}$/.test(trimmed)) return `+91${trimmed}`;
  return trimmed;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit string
}

function isOtpExpired(entry) {
  if (!entry || !entry.expiresAt) return true;
  return Date.now() > entry.expiresAt;
}

// @desc    Register user (start signup, send OTP). User is created only after OTP verification.
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  const { name, firstName, lastName, mobile, email, street, city, state, country, loginId, password } = req.body;

  try {
    const normalizedMobile = normalizeMobile(mobile);

    // Basic uniqueness check
    const exists = await User.findOne({ $or: [{ email }, { mobile: normalizedMobile }, { loginId }] });
    if (exists) return res.status(400).json({ success: false, message: 'User already exists with provided email/login/mobile' });

    // Hash password now so we don't keep plaintext
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data but do NOT save to DB yet
    const userData = {
      name: name || `${firstName || ''} ${lastName || ''}`.trim(),
      firstName: firstName || name,
      lastName: lastName || '',
      mobile: normalizedMobile,
      email,
      street,
      city,
      state,
      country,
      loginId: loginId || email || normalizedMobile,
      password: hashedPassword,
      isVerified: false
    };

    // Generate OTP and store in signupStore
    const code = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    signupStore[normalizedMobile] = { userData, code, expiresAt };

    // Send OTP via Twilio if configured
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({ body: `Your verification code is ${code}`, from: process.env.TWILIO_PHONE_NUMBER, to: normalizedMobile });
        return res.json({ success: true, message: 'OTP sent to mobile' });
      } catch (err) {
        // Log detailed error but do NOT block user creation — allow manual OTP entry in non-production
        console.error('Twilio send error during signup', err.message || err);
        const devMode = process.env.NODE_ENV !== 'production';
        return res.json({
          success: true,
          message: 'OTP generated but failed to send SMS. Please enter the code manually.',
          ...(devMode ? { code } : {})
        });
      }
    }

    // Twilio not configured: return OTP in response for local testing
    return res.json({ success: true, message: 'OTP generated (twilio not configured)', code });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { loginId, password } = req.body;

  try {
    let user = await User.findOne({ loginId });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    // Require phone verification before allowing login
    if (user.isVerified === false) {
      return res.status(403).json({ success: false, message: 'Phone number not verified. Please verify your phone before logging in.' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ success: true, message: 'Login successful', token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  try {
    if (!mobile || !otp) return res.status(400).json({ success: false, message: 'Missing mobile or otp' });
    const normalizedMobile = normalizeMobile(mobile);

    // First check signupStore (new user signup flow)
    const signupEntry = signupStore[normalizedMobile];
    if (signupEntry) {
      if (isOtpExpired(signupEntry)) {
        delete signupStore[normalizedMobile];
        return res.status(400).json({ success: false, message: 'OTP expired. Please signup again.' });
      }
      if (signupEntry.code !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

      // Create user in DB now
      try {
        const created = new User(signupEntry.userData);
        created.isVerified = true;
        await created.save();
        delete signupStore[normalizedMobile];
        return res.json({ success: true, message: 'OTP verified and user created successfully' });
      } catch (err) {
        console.error('Failed to create user after OTP', err.message || err);
        return res.status(500).json({ success: false, message: 'Failed to create user' });
      }
    }

    // Otherwise check otpStore for existing users (resend OTP flow)
    const entry = otpStore[normalizedMobile];
    if (!entry) return res.status(400).json({ success: false, message: 'No OTP requested for this number' });
    if (isOtpExpired(entry)) {
      delete otpStore[normalizedMobile];
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }
    if (entry.code !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    // OTP matches — mark existing user as verified
    delete otpStore[normalizedMobile];
    try {
      const user = await User.findOne({ mobile: normalizedMobile });
      if (user) {
        user.isVerified = true;
        await user.save();
      }
    } catch (err) {
      console.error('Failed to mark user verified', err.message || err);
    }
    return res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res) => {
  const { mobile } = req.body;

  try {
    if (!mobile) return res.status(400).json({ success: false, message: 'Missing mobile' });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    const code = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore[mobile] = { code, expiresAt };

    // Attempt to send via Twilio if configured
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: `Your verification code is ${code}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: mobile
        });
        return res.json({ success: true, message: 'OTP resent successfully' });
      } catch (err) {
        console.error('Twilio send error during resend', err.message || err);
        const devMode = process.env.NODE_ENV !== 'production';
        return res.json({
          success: true,
          message: 'OTP generated but failed to send SMS. Please enter the code manually.',
          ...(devMode ? { code } : {})
        });
      }
    }

    // Twilio not configured — return the code for development/trial use
    console.warn('Twilio not configured, returning OTP in response. Do NOT do this in production.');
    return res.json({ success: true, message: 'OTP generated (twilio not configured)', code });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all users
// @route   GET /api/auth/all-users
// @access  Public
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password -__v');
    res.json({ success: true, message: 'Users fetched', data: users });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Send OTP (generate and send via Twilio or return code in response if Twilio not configured)
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;

  try {
    if (!mobile) return res.status(400).json({ success: false, message: 'Missing mobile' });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    const code = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore[mobile] = { code, expiresAt };

    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: `Your verification code is ${code}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: mobile
        });
        return res.json({ success: true, message: 'OTP sent successfully' });
      } catch (err) {
        console.error('Twilio send error', err.message || err);
        return res.status(500).json({ success: false, message: 'Failed to send OTP via Twilio' });
      }
    }

    // Twilio not configured — return the code for development/trial use
    console.warn('Twilio not configured, returning OTP in response. Do NOT do this in production.');
    return res.json({ success: true, message: 'OTP generated (twilio not configured)', code });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Test Twilio sending (useful to debug envs and trial account restrictions)
// @route   POST /api/auth/test-twilio
// @access  Public
exports.testTwilio = async (req, res) => {
  const { mobile, text } = req.body;

  if (!mobile) return res.status(400).json({ success: false, message: 'Missing mobile' });

  if (!twilioClient) {
    console.warn('Twilio client not configured. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    return res.status(500).json({ success: false, message: 'Twilio not configured on server' });
  }

  try {
    const msg = await twilioClient.messages.create({
      body: text || 'Test message from WebsiteLelo',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile
    });
    console.log('Twilio test message sent, SID=', msg.sid);
    return res.json({ success: true, message: 'Message sent', sid: msg.sid });
  } catch (err) {
    console.error('Twilio test send failed:', err.message || err);
    return res.status(500).json({ success: false, message: 'Twilio error: ' + (err.message || 'unknown') });
  }
};
