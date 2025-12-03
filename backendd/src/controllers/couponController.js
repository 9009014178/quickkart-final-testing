const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator'); // Import validationResult
const Coupon = require('../models/couponModel.js');
const User = require('../models/userModel.js'); // Needed for validateCoupon

// --- ADMIN FUNCTIONS ---

/**
 * @desc    Create a new coupon
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
const createCoupon = asyncHandler(async (req, res) => {
  // Check for validation errors first
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // --- If validation passes, continue ---
  const { code, discountType, discountValue, minOrderAmount, expiryDate, usageLimit } = req.body;

  const couponExists = await Coupon.findOne({ code: code }); // Code is already uppercased by validation
  if (couponExists) {
    res.status(400);
    throw new Error('Coupon code already exists');
  }

  // Create coupon with validated and sanitized data
  const coupon = await Coupon.create({
    code: code, // Use sanitized code
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    expiryDate,
    usageLimit: usageLimit || null,
    isActive: true,
  });

  res.status(201).json(coupon);
});

/**
 * @desc    Get all coupons
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({});
  res.json(coupons);
});

/**
 * @desc    Delete a coupon
 * @route   DELETE /api/coupons/:id
 * @access  Private/Admin
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (coupon) {
    await coupon.deleteOne();
    res.json({ message: 'Coupon removed' });
  } else {
    res.status(404);
    throw new Error('Coupon not found');
  }
});

// --- CUSTOMER FUNCTION ---

/**
 * @desc    Validate a coupon code against the current cart
 * @route   POST /api/coupons/validate
 * @access  Private
 */
const validateCoupon = asyncHandler(async (req, res) => {
  // Check for validation errors first
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // --- If validation passes, continue ---
  const { code } = req.body; // Code is already validated/sanitized/uppercased
  const coupon = await Coupon.findOne({ code: code });

  // 1. Check if coupon exists and is active
  if (!coupon || !coupon.isActive) {
    res.status(404);
    throw new Error('Invalid or inactive coupon code');
  }

  // 2. Check if coupon has expired
  if (coupon.expiryDate < new Date()) {
    // Optionally mark as inactive if expired
    // coupon.isActive = false;
    // await coupon.save();
    res.status(400);
    throw new Error('Coupon code has expired');
  }

  // 3. Check usage limit (if applicable)
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
     res.status(400);
     throw new Error('Coupon usage limit reached');
  }

  // 4. Check minimum order amount based on user's current cart
  const user = await User.findById(req.user._id); // req.user comes from 'protect' middleware
  if (!user) {
      res.status(404); throw new Error('User not found');
  }
  // Recalculate cart total on the server side for security
  const cartTotal = user.cart.reduce((acc, item) => acc + item.qty * item.price, 0);

  if (cartTotal < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount of ₹${coupon.minOrderAmount} required`);
  }

  // If all checks pass, calculate the discount
  let discountAmount = 0;
  if (coupon.discountType === 'Percentage') {
    discountAmount = (cartTotal * coupon.discountValue) / 100;
  } else if (coupon.discountType === 'FixedAmount') {
    discountAmount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed cart total
  discountAmount = Math.min(discountAmount, cartTotal);

  res.json({
    message: 'Coupon is valid!',
    code: coupon.code,
    discountAmount: parseFloat(discountAmount.toFixed(2)), // Return calculated discount
    discountType: coupon.discountType,
    discountValue: coupon.discountValue
  });
});

module.exports = {
  createCoupon,
  getCoupons,
  deleteCoupon,
  validateCoupon,
};