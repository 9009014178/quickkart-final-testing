const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/userModel.js');
const Order = require('../models/orderModel.js');
const Settings = require('../models/settingsModel.js');
const { Client } = require("@googlemaps/google-maps-services-js"); // 1. Naya import

// 2. Google Maps client ko initialize karo
const googleMapsClient = new Client({});

/**
 * @desc    Update a delivery partner's online/offline status
 * @route   PUT /api/delivery/status
 * @access  Private/Delivery Partner
 */
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // --- Continue if validation passes ---
  const { isOnline } = req.body;
  const deliveryPartner = await User.findById(req.user._id);

  if (deliveryPartner) {
    deliveryPartner.isOnline = isOnline;
    const updatedPartner = await deliveryPartner.save();
    res.json({
      _id: updatedPartner._id,
      isOnline: updatedPartner.isOnline,
    });
  } else {
    res.status(404);
    throw new Error('Delivery partner not found');
  }
});

/**
 * @desc    Update a delivery partner's current GPS location
 * @route   PUT /api/delivery/location
 * @access  Private/Delivery Partner
 */
const updateLocation = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // --- Continue if validation passes ---
  const { latitude, longitude } = req.body;
  const deliveryPartner = await User.findById(req.user._id);

  if (deliveryPartner) {
    deliveryPartner.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude], // MongoDB requires [longitude, latitude]
    };
    await deliveryPartner.save();
    res.json({ message: 'Location updated successfully' });
  } else {
    res.status(404);
    throw new Error('Delivery partner not found');
  }
});

/**
 * @desc    Find nearest available delivery partners for an order
 * @route   GET /api/delivery/find-partners/:orderId
 * @access  Private/Admin
 */
const findNearestPartners = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (!order.shippingAddress.location || !order.shippingAddress.location.coordinates || order.shippingAddress.location.coordinates.length === 0) {
        res.status(400);
        throw new Error('Order does not have location data');
    }

    // Get delivery radius from settings
    const settings = await Settings.findOne({ siteIdentifier: 'quickkart_settings' });
    const searchRadius = settings ? settings.deliverySearchRadius : 5000; // Use DB value or default to 5km

    const orderLocation = order.shippingAddress.location;

    const nearestPartners = await User.find({
        role: 'Delivery Partner',
        isOnline: true,
        currentLocation: {
            $near: {
                $geometry: orderLocation,
                $maxDistance: searchRadius, // Use the dynamic radius here
            },
        },
    }).select('name email phone'); // Added phone

    if (nearestPartners.length > 0) {
        res.json(nearestPartners);
    } else {
        res.status(404).json({ message: 'No available delivery partners found within the radius' });
    }
});

/**
 * @desc    Assign an order to a delivery partner
 * @route   PUT /api/delivery/assign/:orderId
 * @access  Private/Admin
 */
const assignOrderToPartner = asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // --- Continue if validation passes ---
    const { partnerId } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    const deliveryPartner = await User.findById(partnerId);

    if (!deliveryPartner || deliveryPartner.role !== 'Delivery Partner') {
        res.status(404);
        throw new Error('Delivery partner not found or user is not a delivery partner');
    }

    order.deliveryPartner = deliveryPartner._id;
    const updatedOrder = await order.save();

    res.json({
        message: `Order assigned to ${deliveryPartner.name}`,
        order: updatedOrder,
    });
});

/**
 * @desc    Get all orders assigned to the logged-in delivery partner
 * @route   GET /api/delivery/my-orders
 * @access  Private/Delivery Partner
 */
const getMyAssignedOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ deliveryPartner: req.user._id })
                              .populate('user', 'name phone') // Get customer name/phone
                              .sort({ createdAt: -1 }); // Show newest first
    res.json(orders);
});

/**
 * @desc    Track an order by getting the delivery partner's live location
 * @route   GET /api/delivery/track/:orderId
 * @access  Private/Customer
 */
const trackOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId).populate('deliveryPartner', 'name currentLocation phone'); // Added phone

    // Security check: Make sure the person requesting is the one who placed the order
    if (!order || order.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to view this order');
    }

    if (order.deliveryPartner && order.deliveryPartner.currentLocation) {
        res.json({
            orderStatus: order.orderStatus,
            partnerName: order.deliveryPartner.name,
            partnerPhone: order.deliveryPartner.phone, // Send phone too
            location: order.deliveryPartner.currentLocation,
        });
    } else if (order.deliveryPartner) {
         res.status(404).json({ message: 'Delivery partner location not available yet' });
    } else if (order) {
        res.status(404).json({ message: 'Delivery partner not yet assigned' });
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

/** ## NEW FUNCTION FOR ETA CALCULATION ##
 * @desc    Get delivery ETA for an order
 * @route   GET /api/delivery/eta/:id
 * @access  Private/Customer
 */
const getOrderETA = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const order = await Order.findById(req.params.id)
        .populate('deliveryPartner', 'currentLocation')
        .populate('user', '_id');

    // 1. Check if order is valid and belongs to the customer
    if (!order || order.user._id.toString() !== req.user._id.toString()) {
        res.status(404); throw new Error('Order not found or not authorized');
    }
    // 2. Check if order is 'Out for Delivery'
    if (order.orderStatus !== 'Out for Delivery') {
        res.status(400); throw new Error(`Order is currently ${order.orderStatus}, not Out for Delivery.`);
    }
    // 3. Check for all necessary data
    if (!order.deliveryPartner || !order.deliveryPartner.currentLocation || !order.shippingAddress.location) {
        res.status(400); throw new Error('Cannot calculate ETA: Required location data is missing.');
    }
    if (!process.env.GOOGLE_MAPS_API_KEY) {
        res.status(500); throw new Error('ETA service is currently unavailable.');
    }

    // 4. Set origin (partner) and destination (customer)
    const origin = order.deliveryPartner.currentLocation.coordinates; // [lng, lat]
    const destination = order.shippingAddress.location.coordinates; // [lng, lat]

    // 5. Call Google Maps Distance Matrix API
    try {
        const response = await googleMapsClient.distancematrix({
            params: {
                origins: [`${origin[1]},${origin[0]}`], // API requires "lat,lng" format
                destinations: [`${destination[1]},${destination[0]}`], // API requires "lat,lng" format
                key: process.env.GOOGLE_MAPS_API_KEY,
                units: 'metric',
                mode: 'driving', // Use 'driving' for real traffic estimates
            },
            timeout: 2000, // 2-second timeout
        });

        // 6. Extract the duration from the response
        const element = response.data.rows[0].elements[0];
        if (element.status === 'OK') {
            const durationText = element.duration.text; // e.g., "7 mins"
            const durationValue = element.duration.value; // e.g., 420 (seconds)
            res.json({
                eta: durationText,
                seconds: durationValue,
            });
        } else {
            console.log("Google Maps API could not find a route. Status:", element.status);
            throw new Error('Could not calculate ETA. The destination might be unreachable.');
        }
    } catch (error) {
        console.error("Google Maps API Error:", error.response ? error.response.data.error_message : error.message);
        res.status(500);
        throw new Error('Failed to fetch delivery ETA from Google Maps.');
    }
});


// ## FINAL EXPORTS ##
module.exports = {
  updateDeliveryStatus,
  updateLocation,
  findNearestPartners,
  assignOrderToPartner,
  getMyAssignedOrders,
  trackOrder,
  getOrderETA, // Add the new function
};