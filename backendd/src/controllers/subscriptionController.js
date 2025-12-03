const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/userModel.js');
const Product = require('../models/productModel.js');
const DarkStore = require('../models/darkStoreModel.js');

/**
 * @desc    Create a new subscription
 * @route   POST /api/subscriptions
 * @access  Private
 */
const createSubscription = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity, frequency, shippingAddressId, pincode } = req.body;
    const user = await User.findById(req.user._id);

    // 1. Find the Dark Store for this pincode
    const store = await DarkStore.findOne({ pincode: pincode });
    if (!store) {
        res.status(404);
        throw new Error('Sorry, delivery is not available in your pincode yet.');
    }

    // 2. Find the Product
    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
        res.status(404); throw new Error('Product not found or is unavailable');
    }

    // 3. Find the selected shipping address
    const shippingAddress = user.addresses.id(shippingAddressId);
    if (!shippingAddress) {
        res.status(404); throw new Error('Shipping address not found');
    }
    
    // 4. Check if this exact subscription already exists
    const subscriptionExists = user.subscriptions.find(
        sub => sub.product.toString() === productId && 
               sub.store.toString() === store._id.toString() &&
               sub.isActive === true
    );
    if (subscriptionExists) {
        res.status(400);
        throw new Error('You are already subscribed to this product at this location.');
    }

    // 5. Create the subscription
    const nextDeliveryDate = new Date();
    // Simple logic: set next delivery for tomorrow
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
    
    const newSubscription = {
        product: productId,
        store: store._id,
        quantity,
        frequency,
        shippingAddress: shippingAddress,
        nextDeliveryDate: nextDeliveryDate,
        isActive: true,
    };

    user.subscriptions.push(newSubscription);
    await user.save();

    res.status(201).json(user.subscriptions);
});

/**
 * @desc    Get logged-in user's subscriptions
 * @route   GET /api/subscriptions
 * @access  Private
 */
const getMySubscriptions = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('subscriptions.product', 'name price image')
        .populate('subscriptions.store', 'name pincode');
        
    if (user) {
        res.json(user.subscriptions);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @desc    Cancel (deactivate) a subscription
 * @route   DELETE /api/subscriptions/:id
 * @access  Private
 */
const cancelSubscription = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const subscriptionId = req.params.id;

    if (!user) {
        res.status(404); throw new Error('User not found');
    }
    
    // Find the subscription in the user's array
    const subscription = user.subscriptions.id(subscriptionId);
    
    if (subscription) {
        subscription.isActive = false; // Deactivate instead of deleting
        await user.save();
        res.json({ message: 'Subscription cancelled successfully' });
    } else {
        res.status(404);
        throw new Error('Subscription not found');
    }
});

module.exports = {
    createSubscription,
    getMySubscriptions,
    cancelSubscription,
};