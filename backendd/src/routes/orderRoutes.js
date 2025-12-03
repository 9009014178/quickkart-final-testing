const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders,
  cancelOrder,
  verifyPayment,
} = require('../controllers/orderController.js');

const { protect } = require('../middlewares/authMiddleware.js');
const { admin } = require('../middlewares/adminMiddleware.js');

// --- Validation Rules ---
const placeOrderValidationRules = [
  body('shippingAddressId', 'Shipping Address ID is required')
    .isMongoId()
    .withMessage('Invalid Address ID'),

  // ✅ latitude/longitude no longer required
  body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),

  body('paymentMethod', 'Payment method is required')
    .isIn(['Cash on Delivery', 'Online']),

  body('couponCode')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .escape(),
];


// Reusable validation for MongoDB ObjectId in URL params
const mongoIdParamValidation = [
  param('id', 'Valid Order ID is required in URL').isMongoId(),
];

// --- Routes ---

// Place order
router.route('/').post(protect, placeOrderValidationRules, addOrderItems);

// My orders
router.route('/myorders').get(protect, getMyOrders);

// Verify payment
router.route('/verify-payment').post(protect, verifyPayment);

// Get single order by ID
router.route('/:id').get(protect, mongoIdParamValidation, getOrderById);

// Cancel order
router.route('/:id/cancel').put(protect, mongoIdParamValidation, cancelOrder);

// Admin - Get all orders
router.route('/admin/all').get(protect, admin, getOrders);

module.exports = router;
