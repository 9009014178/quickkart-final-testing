const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { body } = require('express-validator'); // Import body for validation

// --- Validation Rules ---
const registerValidation = [
  body('name', 'Name is required').not().isEmpty().trim().escape(),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
];

const loginValidation = [ // Define rules for login
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password cannot be empty').not().isEmpty(), // Check if password exists
];

const forgotPasswordValidation = [
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
];

const resetPasswordValidation = [
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('otp', 'OTP is required and must be 6 digits').isLength({ min: 6, max: 6 }).isNumeric(), // Be specific about OTP format
  body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
];
// --- End Validation Rules ---


// --- Apply Rules to Routes ---
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser); // Apply login validation rules
router.post('/logout', logoutUser); // No validation needed for logout
router.post('/forgotpassword', forgotPasswordValidation, forgotPassword);
router.post('/resetpassword', resetPasswordValidation, resetPassword);

module.exports = router;