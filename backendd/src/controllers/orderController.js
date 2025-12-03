const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Order = require('../models/orderModel.js');
const User = require('../models/userModel.js');
const Coupon = require('../models/couponModel.js');
const Product = require('../models/productModel.js');
const Settings = require('../models/settingsModel.js');
const DarkStore = require('../models/darkStoreModel.js');
const { sendEmail } = require('./authController.js');
const sendSms = require('../utils/sendSms.js');
const sendPushNotification = require('../utils/sendPushNotification.js');

// --- Payment & Security Imports ---
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
let razorpayInstance;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('Razorpay keys not found in .env. Online payment will not work.');
}

/**
 * @desc    Create a new order (Handles COD and Online Payment)
 * @route   POST /api/orders
 * @access  Private
 */
const addOrderItems = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { shippingAddressId, latitude, longitude, couponCode, paymentMethod } = req.body;
  const user = await User.findById(req.user._id).select('name email phone fcmToken allowSmsNotifications cart addresses');

  if (!user || user.cart.length === 0) { res.status(400); throw new Error('No items in cart'); }
  const shippingAddress = user.addresses.id(shippingAddressId);
  if (!shippingAddress) { res.status(400); throw new Error('Shipping address not found'); }

  const customerLocation = { type: 'Point', coordinates: [longitude, latitude] };
  const store = await DarkStore.findOne({ location: { $near: { $geometry: customerLocation } } });
  if (!store) { res.status(400); throw new Error('Sorry, no delivery store found near your location.'); }
  const storeId = store._id;

  const settings = await Settings.findOne({ siteIdentifier: 'quickkart_settings' });
  if (settings && settings.allowedPincodes.length > 0 && !settings.allowedPincodes.includes(shippingAddress.pincode)) {
      res.status(400);
      throw new Error(`Sorry, delivery is not available in your pincode (${shippingAddress.pincode}).`);
  }

  for (const cartItem of user.cart) {
    if (cartItem.store.toString() !== storeId.toString()) {
        res.status(400); throw new Error(`Item "${cartItem.name}" is from a different store. Your cart must contain items from a single store.`);
    }
    const product = await Product.findById(cartItem.product);
    if (!product || !product.isAvailable) { res.status(400); throw new Error(`Product "${cartItem.name}" is unavailable.`); }
    const storeInventory = product.inventory.find(inv => inv.store.toString() === storeId.toString());
    if (!storeInventory || storeInventory.stock < cartItem.qty) {
        res.status(400);
        throw new Error(`Not enough stock for "${product.name}". Only ${storeInventory ? storeInventory.stock : 0} available.`);
    }
  }

  const itemsPrice = user.cart.reduce((acc, item) => acc + item.qty * item.price, 0);
  let discountAmount = 0;
  let validCoupon = null;
  if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isActive && coupon.expiryDate >= new Date() &&
          (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit) &&
          itemsPrice >= coupon.minOrderAmount)
      {
          if (coupon.discountType === 'Percentage') { discountAmount = (itemsPrice * coupon.discountValue) / 100; }
          else if (coupon.discountType === 'FixedAmount') { discountAmount = coupon.discountValue; }
          discountAmount = Math.min(discountAmount, itemsPrice);
          validCoupon = coupon;
      } else { res.status(400); throw new Error('Invalid or inapplicable coupon code'); }
  }
  const priceAfterDiscount = itemsPrice - discountAmount;
  const taxPrice = parseFloat((priceAfterDiscount * 0.05).toFixed(2));
  const shippingPrice = 20.00;
  const totalPrice = parseFloat((priceAfterDiscount + taxPrice + shippingPrice).toFixed(2));

  const order = new Order({
    user: req.user._id, orderItems: user.cart,
    shippingAddress: {
      addressLine1: shippingAddress.addressLine1, city: shippingAddress.city,
      pincode: shippingAddress.pincode, state: shippingAddress.state, location: customerLocation,
    },
    paymentMethod: paymentMethod,
    couponCode: validCoupon ? validCoupon.code : null,
    discountAmount: discountAmount, taxPrice: taxPrice, shippingPrice: shippingPrice, totalPrice: totalPrice,
    darkStore: storeId,
    orderStatus: 'Pending Payment',
  });

  if (paymentMethod === 'Cash on Delivery') {
    order.orderStatus = 'Placed';
    const createdOrder = await order.save();

    const bulkOps = createdOrder.orderItems.map(item => ({ updateOne: { filter: { _id: item.product, 'inventory.store': storeId }, update: { $inc: { 'inventory.$.stock': -item.qty } } } }));
    await Product.bulkWrite(bulkOps);
    if (validCoupon) {
        validCoupon.usedCount += 1;
        if (validCoupon.usageLimit !== null && validCoupon.usedCount >= validCoupon.usageLimit) { validCoupon.isActive = false; }
        await validCoupon.save();
    }
    user.cart = []; user.lastCartUpdate = Date.now();
    await user.save();
    
    const title = `Order Placed! (#${createdOrder._id.toString().slice(-6)})`;
    const body = `Your COD order for ₹${createdOrder.totalPrice.toFixed(2)} is confirmed.`;
    try { await sendEmail({ email: user.email, subject: `QuickKart: ${title}`, message: `Hi ${user.name},\n\n${body}\n\nThank you!` }); } catch (e) { console.error(e); }
    if (user.phone && user.allowSmsNotifications) { sendSms(user.phone, `QuickKart: ${body}`).catch(e => console.error(e)); }
    if (user.fcmToken) { sendPushNotification(user.fcmToken, title, body, { orderId: createdOrder._id.toString() }).catch(e => console.error(e)); }

    res.status(201).json(createdOrder);

  } else if (paymentMethod === 'Online') {
    if (!razorpayInstance) { throw new Error('Online payment gateway is not configured.'); }
    
    const createdOrder = await order.save();
    const options = {
        amount: Math.round(totalPrice * 100),
        currency: "INR",
        receipt: `receipt_${createdOrder._id}`,
        notes: { order_db_id: createdOrder._id.toString() }
    };
    try {
        const razorpayOrder = await razorpayInstance.orders.create(options);
        createdOrder.paymentResult = { order_id: razorpayOrder.id };
        await createdOrder.save();
        res.status(201).json({
            ...createdOrder.toObject(),
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });
    } catch (paymentError) {
        console.error("Razorpay order creation failed:", paymentError);
        throw new Error("Failed to create payment order.");
    }
  } else {
    res.status(400); throw new Error('Invalid payment method');
  }
});

/**
 * @desc    Verify online payment and update order
 * @route   POST /api/orders/verify-payment
 * @access  Private
 */
const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400); throw new Error('Payment verification data missing');
    }
    const order = await Order.findOne({ 'paymentResult.order_id': razorpay_order_id });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    const user = await User.findById(order.user).select('name email phone fcmToken allowSmsNotifications cart addresses');
    if (!user) { res.status(404); throw new Error('User not found'); }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');

    if (expectedSignature === razorpay_signature) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.orderStatus = 'Placed';
        order.paymentResult.id = razorpay_payment_id;
        order.paymentResult.signature = razorpay_signature;
        order.paymentResult.status = 'Success';
        const updatedOrder = await order.save();
        
        const storeId = order.darkStore;
        const bulkOps = order.orderItems.map(item => ({ updateOne: { filter: { _id: item.product, 'inventory.store': storeId }, update: { $inc: { 'inventory.$.stock': -item.qty } } } }));
        await Product.bulkWrite(bulkOps);
        
        if (order.couponCode) {
            const coupon = await Coupon.findOne({ code: order.couponCode });
            if(coupon) {
                coupon.usedCount += 1;
                if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) { coupon.isActive = false; }
                await coupon.save();
            }
        }
        user.cart = [];
        user.lastCartUpdate = Date.now();
        await user.save();
        
        const title = `Order Placed! (#${updatedOrder._id.toString().slice(-6)})`;
        const body = `Your online payment of ₹${updatedOrder.totalPrice.toFixed(2)} was successful. Your order is placed.`;
        try { await sendEmail({ email: user.email, subject: `QuickKart: ${title}`, message: `Hi ${user.name},\n\n${body}` }); } catch (e) { console.error(e); }
        if (user.phone && user.allowSmsNotifications) { sendSms(user.phone, `QuickKart: ${body}`).catch(e => console.error(e)); }
        if (user.fcmToken) { sendPushNotification(user.fcmToken, title, body, { orderId: updatedOrder._id.toString() }).catch(e => console.error(e)); }

        res.json({ message: "Payment verified successfully, order placed!", order: updatedOrder });
    } else {
        order.paymentResult.status = 'Failed';
        await order.save();
        res.status(400);
        throw new Error('Payment verification failed. Signature mismatch.');
    }
});


// --- OTHER ORDER FUNCTIONS ---

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone').populate('deliveryPartner', 'name email phone').populate('darkStore', 'name pincode address');
  if (order) {
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
       res.status(401); throw new Error('Not authorized to view this order');
    }
    res.json(order);
  } else {
    res.status(404); throw new Error('Order not found');
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
  res.json(orders);
});

const updateOrderStatusToPacked = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'email name phone fcmToken allowSmsNotifications');
  if (order && order.orderStatus === 'Placed') {
    order.orderStatus = 'Packed';
    let assignedPartner = null;
    if (order.shippingAddress.location && order.shippingAddress.location.coordinates) {
        try {
            const settings = await Settings.findOne({ siteIdentifier: 'quickkart_settings' });
            const searchRadius = settings ? settings.deliverySearchRadius : 5000;
            const nearestPartner = await User.findOne({
                role: 'Delivery Partner', isOnline: true,
                currentLocation: { $near: { $geometry: order.shippingAddress.location, $maxDistance: searchRadius } }
            }).populate('email name phone fcmToken');
            if (nearestPartner) {
                order.deliveryPartner = nearestPartner._id;
                assignedPartner = nearestPartner;
            }
        } catch(e) { console.error(`Error during auto-assignment:`, e); }
    }
    const updatedOrder = await order.save();
    const customer = order.user;
    const title = `Order Packed! (#${order._id.toString().slice(-6)})`;
    const body = `Your order has been packed ${ assignedPartner ? `and assigned to ${assignedPartner.name}` : '' }.`;
    try { await sendEmail({ email: customer.email, subject: `QuickKart: ${title}`, message: `Hi ${customer.name},\n\n${body}` }); } catch (e) { console.error(e); }
    if (customer.phone && customer.allowSmsNotifications) { sendSms(customer.phone, `QuickKart: ${body}`).catch(e => console.error(e)); }
    if (customer.fcmToken) { sendPushNotification(customer.fcmToken, title, body, { orderId: order._id.toString() }).catch(e => console.error(e)); }
    if (assignedPartner && assignedPartner.fcmToken) {
      const partnerTitle = "New Delivery Assignment!";
      const partnerBody = `Order #${order._id.toString().slice(-6)} for ₹${order.totalPrice}.`;
      sendPushNotification(assignedPartner.fcmToken, partnerTitle, partnerBody, { orderId: order._id.toString() }).catch(e => console.error(e));
    }
    res.json(updatedOrder);
  } else {
    res.status(400); throw new Error('Order not found or cannot be updated');
  }
});

const updateOrderStatusToOutForDelivery = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Delivery Partner' && req.user.role !== 'Admin') {
     res.status(403); throw new Error('Not authorized');
  }
  const order = await Order.findById(req.params.id).populate('user', 'email name phone fcmToken allowSmsNotifications');
  if (order && order.orderStatus === 'Packed') {
    if (!order.deliveryPartner) {
        if (req.user.role === 'Delivery Partner') { order.deliveryPartner = req.user._id; }
        else { res.status(400); throw new Error('Order must be assigned first.'); }
    }
    if (req.user.role === 'Delivery Partner' && order.deliveryPartner.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('Not authorized to update this order');
    }
    order.orderStatus = 'Out for Delivery';
    const updatedOrder = await order.save();
    const customer = order.user;
    const title = `Out for Delivery! (#${order._id.toString().slice(-6)})`;
    const body = `Your order is on its way!`;
    try { await sendEmail({ email: customer.email, subject: `QuickKart: ${title}`, message: `Hi ${customer.name},\n\n${body}` }); } catch (e) { console.error(e); }
    if (customer.phone && customer.allowSmsNotifications) { sendSms(customer.phone, `QuickKart: ${body}`).catch(e => console.error(e)); }
    if (customer.fcmToken) { sendPushNotification(customer.fcmToken, title, body, { orderId: order._id.toString() }).catch(e => console.error(e)); }
    res.json(updatedOrder);
  } else {
    res.status(400); throw new Error('Order not found or not packed yet');
  }
});

const updateOrderStatusToDelivered = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Delivery Partner' && req.user.role !== 'Admin') {
     res.status(403); throw new Error('Not authorized');
  }
  const order = await Order.findById(req.params.id).populate('user', 'email name phone fcmToken allowSmsNotifications');
  if (order && order.orderStatus === 'Out for Delivery') {
    if (req.user.role === 'Delivery Partner' && (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString())) {
        res.status(403); throw new Error('Not authorized to update this order');
    }
    order.orderStatus = 'Delivered';
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    if (order.paymentMethod === 'Cash on Delivery') {
        order.isPaid = true;
        order.paidAt = Date.now();
    }
    const updatedOrder = await order.save();
    const customer = order.user;
    const title = `Order Delivered! (#${order._id.toString().slice(-6)})`;
    const body = `Your order has been delivered. Enjoy!`;
    try { await sendEmail({ email: customer.email, subject: `QuickKart: ${title}`, message: `Hi ${customer.name},\n\n${body}` }); } catch (e) { console.error(e); }
    if (customer.phone && customer.allowSmsNotifications) { sendSms(customer.phone, `QuickKart: ${body}`).catch(e => console.error(e)); }
    if (customer.fcmToken) { sendPushNotification(customer.fcmToken, title, body, { orderId: order._id.toString() }).catch(e => console.error(e)); }
    res.json(updatedOrder);
  } else {
    res.status(400); throw new Error('Order not found or not out for delivery yet');
  }
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'email name phone fcmToken allowSmsNotifications');
  if (!order) {
     res.status(404); throw new Error('Order not found');
  }
  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'Admin';
  if (!isOwner && !isAdmin) {
    res.status(401); throw new Error('Not authorized');
  }
  if (order.orderStatus === 'Placed' || order.orderStatus === 'Packed') {
    const storeId = order.darkStore;
    if (storeId) {
        try {
            const bulkOps = order.orderItems.map(item => ({
                updateOne: { filter: { _id: item.product, 'inventory.store': storeId }, update: { $inc: { 'inventory.$.stock': item.qty } } }
            }));
            if (bulkOps.length > 0) { await Product.bulkWrite(bulkOps); }
        } catch (stockError) { console.error(`Failed to restore stock for cancelled order ${order._id}:`, stockError); }
    }
    order.orderStatus = 'Cancelled';
    const updatedOrder = await order.save();
    const customer = order.user;
    const title = `Order Cancelled (#${order._id.toString().slice(-6)})`;
    const body = "Your order has been successfully cancelled.";
    try { await sendEmail({ email: customer.email, subject: `QuickKart: ${title}`, message: `Hi ${customer.name},\n\n${body}` }); } catch (e) { console.error(e); }
    if (customer.phone && customer.allowSmsNotifications) { sendSms(customer.phone, `QuickKart: ${body}`).catch(e => console.error(e)); }
    if (customer.fcmToken) { sendPushNotification(customer.fcmToken, title, body, { orderId: order._id.toString() }).catch(e => console.error(e)); }
    res.json(updatedOrder);
  } else {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }
});

const addDeliveryFeedback = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
  const { rating, feedback } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order || order.user.toString() !== req.user._id.toString()) {
    res.status(404); throw new Error('Order not found or not authorized');
  }
  if (!order.isDelivered) { res.status(400); throw new Error('Order has not been delivered yet'); }
  if (order.deliveryRating) { res.status(400); throw new Error('Feedback already submitted'); }
  order.deliveryRating = Number(rating);
  order.deliveryFeedback = feedback;
  await order.save();
  res.status(201).json({ message: 'Feedback submitted successfully' });
});

const reportIssue = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    const { issueType, description, requestRefund, refundAmount } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order || order.user.toString() !== req.user._id.toString()) { res.status(404); throw new Error('Order not found'); }
    if (!order.isDelivered) { res.status(400); throw new Error('Cannot report issue for undelivered order'); }
    if (order.issueReport && order.issueReport.issueType) { res.status(400); throw new Error('Issue already reported'); }
    const allowedIssueTypes = ['Late Delivery', 'Wrong Item', 'Missing Item', 'Damaged Item', 'Other'];
    if (!issueType || !allowedIssueTypes.includes(issueType)) { res.status(400); throw new Error('Please select a valid issue type'); }
    if (!description || description.trim() === '') { res.status(400); throw new Error('Please provide a description'); }
    order.issueReport = {
        issueType, description, status: 'Pending', reportedAt: Date.now(),
        refundDetails: { isRequested: false, status: 'Pending' },
    };
    if (requestRefund === true && refundAmount > 0) {
        if (refundAmount > order.totalPrice) { res.status(400); throw new Error('Refund amount exceeds order total'); }
        order.issueReport.refundDetails = { isRequested: true, requestAmount: Number(refundAmount), status: 'Pending' };
    }
    await order.save();
    res.status(201).json({ message: 'Issue reported successfully' });
});

const resolveIssue = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    const { status, resolution, refundStatus } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order || !order.issueReport || !order.issueReport.issueType) { res.status(400); throw new Error('No issue reported'); }
    if (status) order.issueReport.status = status;
    if (resolution) order.issueReport.resolution = resolution;
    if (order.issueReport.refundDetails && order.issueReport.refundDetails.isRequested && refundStatus) {
        const refundDetails = order.issueReport.refundDetails;
        refundDetails.status = refundStatus;
        refundDetails.processedAt = Date.now();
        if (refundStatus === 'Approved') {
            const amountToRefund = refundDetails.requestAmount;
            console.log(`REFUND PROCESSED: ₹${amountToRefund} for order ${order._id}`);
            // !! REAL-WORLD: Add refund logic here
        }
    }
    const updatedOrder = await order.save();
    try {
        await sendEmail({
            email: order.user.email,
            subject: `Update on your issue for Order #${order._id}`,
            message: `Hi ${order.user.name},\n\nYour issue for order #${order._id} has been updated.\n\nNew Status: ${order.issueReport.status}\nAdmin Comment: ${order.issueReport.resolution || 'N/A'}\nRefund Status: ${order.issueReport.refundDetails ? order.issueReport.refundDetails.status : 'N/A'}\n\nQuickKart Team`,
        });
    } catch (emailError) {
        console.error(`Failed to send issue resolution email:`, emailError);
    }
    res.json(updatedOrder);
});

module.exports = {
  addOrderItems,
  verifyPayment,
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
};






























// const asyncHandler = require('express-async-handler');
// const { validationResult } = require('express-validator');
// const Order = require('../models/orderModel.js');
// const User = require('../models/userModel.js');
// const Coupon = require('../models/couponModel.js');
// const Product = require('../models/productModel.js');
// const Settings = require('../models/settingsModel.js');
// const DarkStore = require('../models/darkStoreModel.js');
// const { sendEmail } = require('./authController.js');
// const sendSms = require('../utils/sendSms.js');

// /**
//  * @desc    Create a new order (With Zonal Inventory & All Features)
//  * @route   POST /api/orders
//  * @access  Private
//  */
// const addOrderItems = asyncHandler(async (req, res) => {
//   // Input Validation
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const { shippingAddressId, latitude, longitude, couponCode } = req.body;
//   const user = await User.findById(req.user._id).select('name email phone allowSmsNotifications cart addresses');

//   // Cart and Address check
//   if (!user || user.cart.length === 0) {
//     res.status(400); throw new Error('No items in cart');
//   }
//   const shippingAddress = user.addresses.id(shippingAddressId);
//   if (!shippingAddress) {
//     res.status(400); throw new Error('Shipping address not found');
//   }

//   // --- 1. FIND NEAREST DARK STORE ---
//   const customerLocation = { type: 'Point', coordinates: [longitude, latitude] };
//   const store = await DarkStore.findOne({
//       location: { $near: { $geometry: customerLocation } }
//   });
//   if (!store) {
//       res.status(400);
//       throw new Error('Sorry, no delivery store found near your location.');
//   }
//   const storeId = store._id;
//   // --- END STORE FIND ---

//   // --- 2. CHECK SERVICEABILITY & ZONAL STOCK ---
//   const settings = await Settings.findOne({ siteIdentifier: 'quickkart_settings' });
//   if (settings && settings.allowedPincodes.length > 0 && !settings.allowedPincodes.includes(shippingAddress.pincode)) {
//       res.status(400);
//       throw new Error(`Sorry, delivery is not available in your pincode (${shippingAddress.pincode}).`);
//   }

//   // Zonal Stock Check
//   for (const cartItem of user.cart) {
//     if (cartItem.store.toString() !== storeId.toString()) {
//         res.status(400);
//         throw new Error(`Item "${cartItem.name}" is from a different store. Your cart must contain items from a single store.`);
//     }
//     const product = await Product.findById(cartItem.product);
//     if (!product || !product.isAvailable) {
//         res.status(400); throw new Error(`Product "${cartItem.name}" is unavailable.`);
//     }
//     const storeInventory = product.inventory.find(inv => inv.store.toString() === storeId.toString());
//     if (!storeInventory || storeInventory.stock < cartItem.qty) {
//         res.status(400);
//         throw new Error(`Not enough stock for "${product.name}". Only ${storeInventory ? storeInventory.stock : 0} available.`);
//     }
//   }
//   // --- END CHECKS ---

//   // --- 3. CALCULATIONS (Tax, Coupon, etc.) ---
//   const itemsPrice = user.cart.reduce((acc, item) => acc + item.qty * item.price, 0);
//   let discountAmount = 0;
//   let validCoupon = null;
//   if (couponCode) {
//       const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
//       if (coupon && coupon.isActive && coupon.expiryDate >= new Date() &&
//           (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit) &&
//           itemsPrice >= coupon.minOrderAmount)
//       {
//           if (coupon.discountType === 'Percentage') { discountAmount = (itemsPrice * coupon.discountValue) / 100; }
//           else if (coupon.discountType === 'FixedAmount') { discountAmount = coupon.discountValue; }
//           discountAmount = Math.min(discountAmount, itemsPrice);
//           validCoupon = coupon;
//       } else { res.status(400); throw new Error('Invalid or inapplicable coupon code'); }
//   }
//   const priceAfterDiscount = itemsPrice - discountAmount;
//   const taxPrice = parseFloat((priceAfterDiscount * 0.05).toFixed(2));
//   const shippingPrice = 20.00;
//   const totalPrice = parseFloat((priceAfterDiscount + taxPrice + shippingPrice).toFixed(2));
//   // --- END CALCULATIONS ---

//   // 4. Create Order
//   const order = new Order({
//     user: req.user._id, orderItems: user.cart,
//     shippingAddress: {
//       addressLine1: shippingAddress.addressLine1, city: shippingAddress.city,
//       pincode: shippingAddress.pincode, state: shippingAddress.state, location: customerLocation,
//     },
//     paymentMethod: 'Cash on Delivery',
//     couponCode: validCoupon ? validCoupon.code : null,
//     discountAmount: discountAmount, taxPrice: taxPrice, shippingPrice: shippingPrice, totalPrice: totalPrice,
//     darkStore: storeId,
//   });
//   const createdOrder = await order.save();

//   // --- 5. UPDATE ZONAL STOCK & COUPON ---
//   const bulkOps = createdOrder.orderItems.map(item => ({
//       updateOne: { filter: { _id: item.product, 'inventory.store': storeId }, update: { $inc: { 'inventory.$.stock': -item.qty } } }
//   }));
//   await Product.bulkWrite(bulkOps);
//   if (validCoupon) {
//       validCoupon.usedCount += 1;
//       if (validCoupon.usageLimit !== null && validCoupon.usedCount >= validCoupon.usageLimit) { validCoupon.isActive = false; }
//       await validCoupon.save();
//   }

//   // --- 6. CLEAR CART ---
//   user.cart = [];
//   user.lastCartUpdate = Date.now();
//   await user.save();

//   // --- 7. SEND NOTIFICATIONS ---
//   try {
//     await sendEmail({
//       email: user.email,
//       subject: `QuickKart Order Confirmation #${createdOrder._id}`,
//       message: `Hi ${user.name},\n\nYour order #${createdOrder._id} has been placed successfully!\n\n` +
//                `Items Price: ₹${itemsPrice.toFixed(2)}\n` +
//                (createdOrder.discountAmount > 0 ? `Discount (${createdOrder.couponCode}): -₹${createdOrder.discountAmount.toFixed(2)}\n` : '') +
//                `Tax (GST): +₹${createdOrder.taxPrice.toFixed(2)}\n` +
//                `Delivery Charge: +₹${createdOrder.shippingPrice.toFixed(2)}\n` +
//                `Total Amount: ₹${createdOrder.totalPrice.toFixed(2)}\n\n` +
//                `Thank you for shopping with QuickKart!`,
//     });
//   } catch (e) { console.error(`Failed to send order confirmation email:`, e); }
//   if (user.phone && user.allowSmsNotifications) {
//     const smsBody = `QuickKart: Order #${createdOrder._id} placed! Total: ₹${createdOrder.totalPrice.toFixed(2)}.`;
//     sendSms(user.phone, smsBody).catch(e => console.error(`Failed to send placed SMS:`, e));
//   }
//   res.status(201).json(createdOrder);
// });

// // --- OTHER ORDER FUNCTIONS ---

// const getOrderById = asyncHandler(async (req, res) => {
//   const order = await Order.findById(req.params.id)
//     .populate('user', 'name email phone')
//     .populate('deliveryPartner', 'name email phone')
//     .populate('darkStore', 'name pincode address');
//   if (order) {
//     if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
//        res.status(401);
//        throw new Error('Not authorized to view this order');
//     }
//     res.json(order);
//   } else {
//     res.status(404); throw new Error('Order not found');
//   }
// });

// const getMyOrders = asyncHandler(async (req, res) => {
//   const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
//   res.json(orders);
// });

// const getOrders = asyncHandler(async (req, res) => {
//   const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
//   res.json(orders);
// });

// const updateOrderStatusToPacked = asyncHandler(async (req, res) => {
//   const order = await Order.findById(req.params.id).populate('user', 'email name phone allowSmsNotifications fcmToken');
//   if (order && order.orderStatus === 'Placed') {
//     order.orderStatus = 'Packed';
//     let assignedPartner = null;
//     if (order.shippingAddress.location && order.shippingAddress.location.coordinates) {
//         try {
//             const settings = await Settings.findOne({ siteIdentifier: 'quickkart_settings' });
//             const searchRadius = settings ? settings.deliverySearchRadius : 5000;
//             const nearestPartner = await User.findOne({
//                 role: 'Delivery Partner', isOnline: true,
//                 currentLocation: { $near: { $geometry: order.shippingAddress.location, $maxDistance: searchRadius } }
//             }).populate('email name phone fcmToken');
//             if (nearestPartner) {
//                 order.deliveryPartner = nearestPartner._id;
//                 assignedPartner = nearestPartner;
//             }
//         } catch(e) { console.error(`Error during auto-assignment:`, e); }
//     }
//     const updatedOrder = await order.save();
//     const customer = order.user;
//     const title = `Order Packed! (#${order._id.toString().slice(-6)})`;
//     const body = `Your order has been packed ${ assignedPartner ? `and assigned to ${assignedPartner.name}` : '' }.`;
//     try { await sendEmail({ email: customer.email, subject: `QuickKart: ${title}`, message: `Hi ${customer.name},\n\n${body}\n\nQuickKart Team` }); } catch (e) { console.error(e); }
//     if (customer.phone && customer.allowSmsNotifications) { sendSms(customer.phone, `QuickKart: ${body}`).catch(e => console.error(e)); }
//     if (customer.fcmToken) { sendPushNotification(customer.fcmToken, title, body, { orderId: order._id.toString() }).catch(e => console.error(e)); }
//     if (assignedPartner && assignedPartner.fcmToken) {
//       const partnerTitle = "New Delivery Assignment!";
//       const partnerBody = `You have a new order (#${order._id.toString().slice(-6)}) for ₹${order.totalPrice}.`;
//       sendPushNotification(assignedPartner.fcmToken, partnerTitle, partnerBody, { orderId: order._id.toString() }).catch(e => console.error(e));
//     }
//     res.json(updatedOrder);
//   } else {
//     res.status(400); throw new Error('Order not found or cannot be updated');
//   }
// });

// const updateOrderStatusToOutForDelivery = asyncHandler(async (req, res) => {
//   if (req.user.role !== 'Delivery Partner' && req.user.role !== 'Admin') {
//      res.status(403); throw new Error('Not authorized');
//   }
//   const order = await Order.findById(req.params.id).populate('user', 'email name phone allowSmsNotifications fcmToken');
//   if (order && order.orderStatus === 'Packed') {
//     if (!order.deliveryPartner) {
//         if (req.user.role === 'Delivery Partner') { order.deliveryPartner = req.user._id; }
//         else { res.status(400); throw new Error('Order must be assigned first.'); }
//     }
//     if (req.user.role === 'Delivery Partner' && order.deliveryPartner.toString() !== req.user._id.toString()) {
//         res.status(403); throw new Error('Not authorized to update this order');
//     }
//     order.orderStatus = 'Out for Delivery';
//     const updatedOrder = await order.save();
//     const customer = order.user;
//     const title = `Order Out for Delivery! (#${order._id.toString().slice(-6)})`;
//     const body = `Your order is on its way!`;
//     try { await sendEmail({ email: customer.email, subject: `QuickKart: ${title}`, message: `Hi ${customer.name},\n\n${body}\n\nQuickKart Team` }); } catch (e) { console.error(e); }
//     if (customer.phone && customer.allowSmsNotifications) { sendSms(customer.phone, `QuickKart: ${body}`).catch(e => console.error(e)); }
//     if (customer.fcmToken) { sendPushNotification(customer.fcmToken, title, body, { orderId: order._id.toString() }).catch(e => console.error(e)); }
//     res.json(updatedOrder);
//   } else {
//     res.status(400); throw new Error('Order not found or not packed yet');
//   }
// });

// const updateOrderStatusToDelivered = asyncHandler(async (req, res) => {
//   if (req.user.role !== 'Delivery Partner' && req.user.role !== 'Admin') {
//      res.status(403); throw new Error('Not authorized');
//   }
//   const order = await Order.findById(req.params.id).populate('user', 'email name phone allowSmsNotifications fcmToken');
//   if (order && order.orderStatus === 'Out for Delivery') {
//     if (req.user.role === 'Delivery Partner' && (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString())) {
//         res.status(403); throw new Error('Not authorized to update this order');
//     }
//     order.orderStatus = 'Delivered';
//     order.isDelivered = true;
//     order.deliveredAt = Date.now();
//     if (order.paymentMethod === 'Cash on Delivery') {
//         order.isPaid = true;
//         order.paidAt = Date.now();
//     }
//     const updatedOrder = await order.save();
//     const customer = order.user;
//     const title = `Order Delivered! (#${order._id.toString().slice(-6)})`;
//     const body = `Your order has been delivered. Enjoy!`;
//     try { await sendEmail({ email: customer.email, subject: `QuickKart: ${title}`, message: `Hi ${customer.name},\n\n${body}\n\nQuickKart Team` }); } catch (e) { console.error(e); }
//     if (customer.phone && customer.allowSmsNotifications) { sendSms(customer.phone, `QuickKart: ${body}`).catch(e => console.error(e)); }
//     if (customer.fcmToken) { sendPushNotification(customer.fcmToken, title, body, { orderId: order._id.toString() }).catch(e => console.error(e)); }
//     res.json(updatedOrder);
//   } else {
//     res.status(400); throw new Error('Order not found or not out for delivery yet');
//   }
// });

// const cancelOrder = asyncHandler(async (req, res) => {
//   const order = await Order.findById(req.params.id).populate('user', 'email name phone allowSmsNotifications fcmToken');
//   if (!order) {
//      res.status(404); throw new Error('Order not found');
//   }
//   const isOwner = order.user._id.toString() === req.user._id.toString();
//   const isAdmin = req.user.role === 'Admin';
//   if (!isOwner && !isAdmin) {
//     res.status(401); throw new Error('Not authorized');
//   }
//   if (order.orderStatus === 'Placed' || order.orderStatus === 'Packed') {
//     const storeId = order.darkStore;
//     if (storeId) {
//         try {
//             const bulkOps = order.orderItems.map(item => ({
//                 updateOne: { filter: { _id: item.product, 'inventory.store': storeId }, update: { $inc: { 'inventory.$.stock': item.qty } } }
//             }));
//             if (bulkOps.length > 0) { await Product.bulkWrite(bulkOps); }
//         } catch (stockError) { console.error(`Failed to restore stock for cancelled order ${order._id}:`, stockError); }
//     }
//     order.orderStatus = 'Cancelled';
//     const updatedOrder = await order.save();
//     const customer = order.user;
//     const title = `Order Cancelled (#${order._id.toString().slice(-6)})`;
//     const body = "Your order has been successfully cancelled.";
//     try { await sendEmail({ email: customer.email, subject: `QuickKart: ${title}`, message: `Hi ${customer.name},\n\n${body}\n\nQuickKart Team` }); } catch (e) { console.error(e); }
//     if (customer.phone && customer.allowSmsNotifications) { sendSms(customer.phone, `QuickKart: ${body}`).catch(e => console.error(e)); }
//     if (customer.fcmToken) { sendPushNotification(customer.fcmToken, title, body, { orderId: order._id.toString() }).catch(e => console.error(e)); }
//     res.json(updatedOrder);
//   } else {
//     res.status(400);
//     throw new Error('Order cannot be cancelled at this stage');
//   }
// });

// const addDeliveryFeedback = asyncHandler(async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
//   const { rating, feedback } = req.body;
//   const order = await Order.findById(req.params.id);
//   if (!order || order.user.toString() !== req.user._id.toString()) {
//     res.status(404); throw new Error('Order not found or not authorized');
//   }
//   if (!order.isDelivered) { res.status(400); throw new Error('Order has not been delivered yet'); }
//   if (order.deliveryRating) { res.status(400); throw new Error('Feedback already submitted'); }
//   order.deliveryRating = Number(rating);
//   order.deliveryFeedback = feedback;
//   await order.save();
//   res.status(201).json({ message: 'Feedback submitted successfully' });
// });

// const reportIssue = asyncHandler(async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
//     const { issueType, description, requestRefund, refundAmount } = req.body;
//     const order = await Order.findById(req.params.id);
//     if (!order || order.user.toString() !== req.user._id.toString()) { res.status(404); throw new Error('Order not found'); }
//     if (!order.isDelivered) { res.status(400); throw new Error('Cannot report issue for undelivered order'); }
//     if (order.issueReport && order.issueReport.issueType) { res.status(400); throw new Error('Issue already reported'); }
//     const allowedIssueTypes = ['Late Delivery', 'Wrong Item', 'Missing Item', 'Damaged Item', 'Other'];
//     if (!issueType || !allowedIssueTypes.includes(issueType)) { res.status(400); throw new Error('Please select a valid issue type'); }
//     if (!description || description.trim() === '') { res.status(400); throw new Error('Please provide a description'); }
//     order.issueReport = {
//         issueType, description, status: 'Pending', reportedAt: Date.now(),
//         refundDetails: { isRequested: false, status: 'Pending' },
//     };
//     if (requestRefund === true && refundAmount > 0) {
//         if (refundAmount > order.totalPrice) { res.status(400); throw new Error('Refund amount exceeds order total'); }
//         order.issueReport.refundDetails = { isRequested: true, requestAmount: Number(refundAmount), status: 'Pending' };
//     }
//     await order.save();
//     res.status(201).json({ message: 'Issue reported successfully' });
// });

// const resolveIssue = asyncHandler(async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
//     const { status, resolution, refundStatus } = req.body;
//     const order = await Order.findById(req.params.id).populate('user', 'name email');
//     if (!order || !order.issueReport || !order.issueReport.issueType) { res.status(400); throw new Error('No issue reported'); }
//     if (status) order.issueReport.status = status;
//     if (resolution) order.issueReport.resolution = resolution;
//     if (order.issueReport.refundDetails && order.issueReport.refundDetails.isRequested && refundStatus) {
//         const refundDetails = order.issueReport.refundDetails;
//         refundDetails.status = refundStatus;
//         refundDetails.processedAt = Date.now();
//         if (refundStatus === 'Approved') {
//             const amountToRefund = refundDetails.requestAmount;
//             console.log(`REFUND PROCESSED: ₹${amountToRefund} for order ${order._id}`);
//             // !! REAL-WORLD: Add refund logic here
//         }
//     }
//     const updatedOrder = await order.save();
//     try {
//         await sendEmail({
//             email: order.user.email,
//             subject: `Update on your issue for Order #${order._id}`,
//             message: `Hi ${order.user.name},\n\nYour issue for order #${order._id} has been updated.\n\nNew Status: ${order.issueReport.status}\nAdmin Comment: ${order.issueReport.resolution || 'N/A'}\nRefund Status: ${order.issueReport.refundDetails ? order.issueReport.refundDetails.status : 'N/A'}\n\nQuickKart Team`,
//         });
//     } catch (emailError) {
//         console.error(`Failed to send issue resolution email:`, emailError);
//     }
//     res.json(updatedOrder);
// });

// module.exports = {
//   addOrderItems,
//   getOrderById,
//   getMyOrders,
//   getOrders,
//   updateOrderStatusToPacked,
//   updateOrderStatusToOutForDelivery,
//   updateOrderStatusToDelivered,
//   cancelOrder,
//   addDeliveryFeedback,
//   reportIssue,
//   resolveIssue,
// };