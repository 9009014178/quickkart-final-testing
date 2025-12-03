const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatusToPacked,
  updateOrderStatusToOutForDelivery,
  updateOrderStatusToDelivered,
  cancelOrder,
  addDeliveryFeedback,
  reportIssue,
  resolveIssue,
  verifyPayment,
} = require('../controllers/orderController.js');

const { protect } = require('../middlewares/authMiddleware.js');
const { admin } = require('../middlewares/adminMiddleware.js');
const { deliveryPartner } = require('../middlewares/deliveryPartnerMiddleware.js');

// --- Validation Rules ---

const placeOrderValidationRules = [
  body('shippingAddressId', 'Shipping Address ID is required')
    .isMongoId()
    .withMessage('Invalid Address ID'),
  body('latitude', 'Valid latitude is required').isFloat({ min: -90, max: 90 }),
  body('longitude', 'Valid longitude is required').isFloat({ min: -180, max: 180 }),
  body('paymentMethod', 'Payment method is required').isIn(['Cash on Delivery', 'Online']),
  body('couponCode').optional().isString().toUpperCase().trim().escape(),
];

const feedbackValidationRules = [
  body('rating', 'Rating must be a number between 1 and 5').isFloat({ min: 1, max: 5 }),
  body('feedback', 'Feedback comment is invalid').optional().trim().escape(),
];

const issueReportValidationRules = [
  body('issueType', 'Valid issue type is required').isIn([
    'Late Delivery',
    'Wrong Item',
    'Missing Item',
    'Damaged Item',
    'Other',
  ]),
  body('description', 'Description is required').not().isEmpty().trim().escape(),
  body('requestRefund').optional().isBoolean(),
  body('refundAmount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Refund amount must be positive'),
];

const resolveIssueValidationRules = [
  body('status', 'Issue status is required').isIn([
    'Pending',
    'Investigating',
    'Resolved',
    'Rejected',
  ]),
  body('resolution', 'Resolution comment is required').optional().trim().escape(),
  body('refundStatus', 'Refund status is required if refund was requested')
    .optional()
    .isIn(['Pending', 'Approved', 'Rejected']),
];

// Reusable validation for MongoDB ObjectId in URL params
const mongoIdParamValidation = [
  param('id', 'Valid Order ID is required in URL').isMongoId(),
];

// ## Customer Routes ##

// Place order (customer)
router
  .route('/')
  .post(protect, placeOrderValidationRules, addOrderItems) // place order
  .get(protect, admin, getOrders); // admin - get all orders

// My orders (order history)
router.route('/myorders').get(protect, getMyOrders);

// Verify payment
router.route('/verify-payment').post(protect, verifyPayment);

// Get single order by ID
router.route('/:id').get(protect, mongoIdParamValidation, getOrderById);

// Cancel order
router.route('/:id/cancel').put(protect, mongoIdParamValidation, cancelOrder);

// Customer feedback
router
  .route('/:id/feedback')
  .post(protect, [...mongoIdParamValidation, ...feedbackValidationRules], addDeliveryFeedback);

// Report issue
router
  .route('/:id/report-issue')
  .post(protect, [...mongoIdParamValidation, ...issueReportValidationRules], reportIssue);

// Resolve issue (admin)
router
  .route('/:id/resolve-issue')
  .put(protect, admin, [...mongoIdParamValidation, ...resolveIssueValidationRules], resolveIssue);

// ## Admin Routes ##
router
  .route('/:id/pack')
  .put(protect, admin, mongoIdParamValidation, updateOrderStatusToPacked);

// ## Delivery Partner & Admin Routes ##
router
  .route('/:id/outfordelivery')
  .put(protect, mongoIdParamValidation, updateOrderStatusToOutForDelivery);

router
  .route('/:id/deliver')
  .put(protect, mongoIdParamValidation, updateOrderStatusToDelivered);

module.exports = router;
