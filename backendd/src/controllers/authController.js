const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

// -----------------------------------------------------------------------------
// 🧠 Utility: Generate JWT Token
// -----------------------------------------------------------------------------
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// -----------------------------------------------------------------------------
// 🧾 Register User
// POST /api/auth/register
// -----------------------------------------------------------------------------
const registerUser = asyncHandler(async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const user = await User.create({ name, email, password, role });

  if (!user) {
    return res.status(400).json({ message: 'Invalid user data' });
  }

  // Respond with token
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token: generateToken(user._id), // ✅ Consistent with protect()
  });
});

// -----------------------------------------------------------------------------
// 🔑 Login User
// POST /api/auth/login
// -----------------------------------------------------------------------------
const loginUser = asyncHandler(async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // ✅ Return token for frontend (Authorization header usage)
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token, // 👈 FRONTEND WILL USE THIS (Bearer token)
  });
});

// -----------------------------------------------------------------------------
// 🚪 Logout User
// POST /api/auth/logout
// -----------------------------------------------------------------------------
const logoutUser = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

// -----------------------------------------------------------------------------
// 📧 Send Email Helper
// -----------------------------------------------------------------------------
const sendEmail = async (options) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: options.email,
      from: process.env.SENDGRID_VERIFIED_EMAIL,
      subject: options.subject,
      text: options.message,
    };
    await sgMail.send(msg);
    console.log(`📩 Email sent to ${options.email}`);
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    if (error.response) console.error(error.response.body);
  }
};

// -----------------------------------------------------------------------------
// 🔐 Forgot Password - Send OTP
// POST /api/auth/forgotpassword
// -----------------------------------------------------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user = await User.findOne({ email: req.body.email });

  // Always return generic success message to prevent user enumeration
  if (!user) {
    return res.status(200).json({
      status: 'success',
      message: 'If a user with that email exists, an OTP has been sent.',
    });
  }

  const otp = user.createPasswordResetOTP();
  await user.save({ validateBeforeSave: false });

  try {
    const message = `You requested a password reset. Your OTP is: ${otp}\nThis OTP is valid for 10 minutes.`;
    await sendEmail({
      email: user.email,
      subject: 'Your Password Reset OTP (Valid for 10 Mins)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'OTP sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({
      message: 'There was an error sending the email. Try again later.',
    });
  }
});

// -----------------------------------------------------------------------------
// 🔁 Reset Password via OTP
// POST /api/auth/resetpassword
// -----------------------------------------------------------------------------
const resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, otp, password } = req.body;

  const user = await User.findOne({
    email,
    passwordResetToken: otp,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: 'OTP is invalid or expired.' });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully!',
    token: generateToken(user._id),
  });
});

// -----------------------------------------------------------------------------
// 🧩 Export Controllers
// -----------------------------------------------------------------------------
module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  sendEmail,
};
