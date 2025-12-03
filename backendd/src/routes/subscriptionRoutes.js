const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
    createSubscription,
    getMySubscriptions,
    cancelSubscription,
} = require('../controllers/subscriptionController.js');
const { protect } = require('../middlewares/authMiddleware.js');

// Validation rules for creating a subscription
const createSubscriptionRules = [
    body('productId', 'Product ID is required').isMongoId(),
    body('quantity', 'Quantity must be a positive integer').isInt({ gt: 0 }),
    body('frequency', 'Frequency must be Daily, Weekly, or Monthly').isIn(['Daily', 'Weekly', 'Monthly']),
    body('shippingAddressId', 'Shipping Address ID is required').isMongoId(),
    body('pincode', 'Pincode is required').isPostalCode('IN'),
];

// Routes for managing subscriptions
router.route('/')
    .post(protect, createSubscriptionRules, createSubscription)
    .get(protect, getMySubscriptions);

router.route('/:id')
    .delete(protect, [param('id', 'Invalid Subscription ID').isMongoId()], cancelSubscription);

module.exports = router;