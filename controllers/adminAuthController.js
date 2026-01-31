const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

// Helper: Send OTP
const sendOtp = async (admin) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  admin.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  admin.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
  await admin.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: admin.email,
      subject: 'Admin Verification Code - GigsTm',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #026bae;">Verify Admin Account</h2>
          <p>Hi ${admin.name},</p>
          <p>Your verification code is:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #026bae; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code is valid for 10 minutes.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('OTP Email failed:', err);
  }
};

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

// Send response with token
const createSendToken = (admin, statusCode, req, res) => {
  const token = signToken(admin._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('jwt_admin', token, cookieOptions); // Use a different cookie name

  // Explicitly set session as requested
  if (req.session) {
    req.session.admin = {
      id: admin._id,
      email: admin.email,
      role: 'admin'
    };
  }

  admin.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      admin
    }
  });
};

exports.logout = (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).send('Could not log out.');
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      res.clearCookie('jwt_admin');   // Clear auth token cookie
      res.redirect('/admin-login.html');
    });
  } else {
    res.redirect('/admin-login.html');
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered as admin'
      });
    }

    const newAdmin = await Admin.create({
      name,
      email,
      password,
      isVerified: false
    });

    await sendOtp(newAdmin);

    res.status(201).json({
      status: 'success',
      message: 'OTP sent to email. Please verify to complete registration.',
      data: {
        email: newAdmin.email
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and OTP'
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({
        status: 'error',
        message: 'Admin not found'
      });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (
      admin.otpHash !== hashedOtp ||
      admin.otpExpiresAt < Date.now()
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    admin.isVerified = true;
    admin.otpHash = undefined;
    admin.otpExpiresAt = undefined;
    await admin.save({ validateBeforeSave: false });

    createSendToken(admin, 200, req, res);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin || !(await admin.correctPassword(password, admin.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    if (!admin.isVerified) {
      // Trigger OTP flow for unverified admin
      await sendOtp(admin);
      return res.status(403).json({
        status: 'fail',
        message: 'Account not verified. OTP sent to email.',
        data: {
            email: admin.email,
            isVerified: false
        }
      });
    }

    createSendToken(admin, 200, req, res);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check of it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt_admin) {
      token = req.cookies.jwt_admin;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentAdmin = await Admin.findById(decoded.id);
    if (!currentAdmin) {
      return res.status(401).json({
        status: 'error',
        message: 'The admin belonging to this token does no longer exist.'
      });
    }

    if (!currentAdmin.isVerified) {
        return res.status(401).json({
            status: 'error',
            message: 'Admin account not verified. Please login to verify.'
        });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.admin = currentAdmin;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token or session expired'
    });
  }
};

exports.getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      admin: req.admin
    }
  });
};
