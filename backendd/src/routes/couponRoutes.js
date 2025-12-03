const express = require('express');
const router = express.Router();
const { body } = require('express-validator'); // Import body
const {
  createCoupon,
  getCoupons,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController.js');
const { protect } = require('../middlewares/authMiddleware.js');
const { admin } = require('../middlewares/adminMiddleware.js');

// --- Validation Rules for Creating Coupon ---
const createCouponValidationRules = [
  body('code', 'Coupon code is required').not().isEmpty().trim().escape().toUpperCase(),
  body('discountType', 'Discount type must be Percentage or FixedAmount').isIn(['Percentage', 'FixedAmount']),
  body('discountValue', 'Discount value must be a positive number').isFloat({ gt: 0 }),
  body('minOrderAmount', 'Minimum order amount must be a non-negative number').optional({ checkFalsy: true }).isFloat({ gte: 0 }),
  body('expiryDate', 'Expiry date is required and must be a valid date in YYYY-MM-DD format').isISO8601().toDate(),
  body('usageLimit', 'Usage limit must be a positive integer').optional({ nullable: true }).isInt({ gt: 0 }),
];

// --- Validation rules for validating coupon ---
const validateCouponValidationRules = [
    body('code', 'Coupon code is required').not().isEmpty().trim().escape().toUpperCase(),
];

// --- Admin routes ---
router.route('/')
    .post(protect, admin, createCouponValidationRules, createCoupon)
    .get(protect, admin, getCoupons);
router.route('/:id').delete(protect, admin, deleteCoupon);

// --- Customer route ---
// Apply validation rules before validateCoupon
router.route('/validate').post(protect, validateCouponValidationRules, validateCoupon);

module.exports = router;