const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendEmail = require('../utils/email');

// Helper: Send OTP
const sendOtp = async (user) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Verification Code - GigsTm',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #026bae;">Verify Your Email</h2>
          <p>Hi ${user.name},</p>
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
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    const newUser = await User.create({
      name,
      email,
      password
    });

    // Send OTP for new users
    await sendOtp(newUser);

    createSendToken(newUser, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // OTP Logic for unverified users
    if (!user.emailVerified) {
      await sendOtp(user);
    }

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ status: 'error', message: 'Please provide OTP' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (user.otpHash !== hashedOtp || user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
    }

    user.emailVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ status: 'success', message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ status: 'error', message: 'Email already verified' });
    }

    await sendOtp(user);

    res.status(200).json({ status: 'success', message: 'OTP resent successfully' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔍 Password reset requested for:', email);

    // 1) Validate email input
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an email address'
      });
    }

    // 2) Get user based on email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({
        status: 'error',
        message: 'No user found with that email address'
      });
    }

    console.log('✅ User found:', user.name, user.email);

    // 3) Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    console.log('✅ Reset token generated');

    // 4) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;

    console.log('📧 Attempting to send email...');
    console.log('Email config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USERNAME,
      hasPassword: !!process.env.EMAIL_PASSWORD,
      passwordLength: process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0
    });

    try {
      // Configure email transporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false // For development
        },
        debug: true, // Enable debug output
        logger: true // Log to console
      });

      // Verify connection configuration
      console.log('🔄 Verifying SMTP connection...');
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');

      const mailOptions = {
        from: `"GigsTm" <${process.env.EMAIL_USERNAME}>`,
        to: user.email,
        subject: 'Password Reset Request (Valid for 10 minutes)',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #026bae;">Password Reset Request</h2>
            <p>Hi ${user.name},</p>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetURL}" 
                 style="background-color: #026bae; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${resetURL}</p>
            <p><strong>This link will expire in 10 minutes.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">GigsTm - All rights reserved</p>
          </div>
        `
      };

      console.log('📤 Sending email to:', user.email);
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', info.messageId);
      console.log('Response:', info.response);

      res.status(200).json({
        status: 'success',
        message: 'Password reset link sent to your email'
      });
    } catch (err) {
      console.error('❌ Email sending error:');
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error command:', err.command);
      console.error('Full error:', err);

      // Rollback token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: 'error',
        message: 'Error sending email. Please try again later.',
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            error: err.message,
            code: err.code
          }
        })
      });
    }
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Reset Password
// Change Password
exports.changePassword = async (req, res) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Your current password is incorrect'
      });
    }

    // 3) Check if new passwords match
    if (req.body.newPassword !== req.body.confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New passwords do not match'
      });
    }

    // 4) Update password
    user.password = req.body.newPassword;
    await user.save();

    // 5) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Error changing password. Please try again.'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    console.log('🔄 Password reset attempt with token');

    // 1) Get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token valid and not expired, set new password
    if (!user) {
      console.log('❌ Invalid or expired token');
      return res.status(400).json({
        status: 'error',
        message: 'Token is invalid or has expired'
      });
    }

    console.log('✅ Valid token found for user:', user.email);

    // Validate password
    if (!req.body.password || req.body.password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long'
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log('✅ Password reset successful for:', user.email);

    // 3) Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};