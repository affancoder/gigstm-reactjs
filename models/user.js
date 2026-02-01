const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },

  passwordResetToken: String,
  passwordResetExpires: Date,

  emailVerified: {
    type: Boolean,
    default: false
  },
  otpHash: String,
  otpExpiresAt: Date,

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'disapproved'],
    default: 'pending',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password and generate uniqueId before save
userSchema.pre('save', async function (next) {
  // Generate uniqueId if not present
  if (!this.uniqueId) {
    let isUnique = false;
    while (!isUnique) {
      // Generate random number (min 4 digits, max 9 digits for scale)
      const randomNum = Math.floor(1000 + Math.random() * 9999000); 
      const candidateId = `GIG${randomNum}`;
      
      // Check collision using the model constructor
      const existingUser = await this.constructor.findOne({ uniqueId: candidateId });
      
      if (!existingUser) {
        this.uniqueId = candidateId;
        isUnique = true;
      }
    }
  }

  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Fix: Check if model exists before creating it
module.exports = mongoose.models.User || mongoose.model('User', userSchema);