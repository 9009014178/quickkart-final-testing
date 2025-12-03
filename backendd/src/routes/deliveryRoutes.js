const express = require('express');
const router = express.Router();
// Import both body and param for validation
const { body, param } = require('express-validator');
const {
  updateDeliveryStatus,
  updateLocation,
  findNearestPartners,
  assignOrderToPartner,
  getMyAssignedOrders,
  trackOrder,
  getOrderETA, // 1. Naya function import karo
} = require('../controllers/deliveryController.js');
const { protect } = require('../middlewares/authMiddleware.js');
const { admin } = require('../middlewares/adminMiddleware.js');
const { deliveryPartner } = require('../middlewares/deliveryPartnerMiddleware.js');

// --- Validation Rules ---
const statusValidation = [
    body('isOnline', 'Status must be true or false').exists().isBoolean(),
];
const locationValidation = [
    body('latitude', 'Valid latitude is required').exists().isFloat({ min: -90, max: 90 }),
    body('longitude', 'Valid longitude is required').exists().isFloat({ min: -180, max: 180 }),
];
// Combined validation for assigning a partner
const assignValidation = [
    param('id', 'Valid Order ID is required in URL').isMongoId(), // Parameter is now 'id'
    body('partnerId', 'Delivery Partner ID is required in body').isMongoId(),
];
// Reusable validation for MongoDB ObjectId in URL params
const mongoIdParamValidation = [
    param('id', 'Valid ID is required in URL').isMongoId(),
];
// --- End Validation Rules ---


// ## Routes for Delivery Partners ##
router.route('/status').put(protect, deliveryPartner, statusValidation, updateDeliveryStatus);
router.route('/location').put(protect, deliveryPartner, locationValidation, updateLocation);
router.route('/my-orders').get(protect, deliveryPartner, getMyAssignedOrders);

// ## Routes for Admins ##
// Consistent parameter name ':id' for the order
router.route('/find-partners/:id').get(protect, admin, mongoIdParamValidation, findNearestPartners);
router.route('/assign/:id').put(protect, admin, assignValidation, assignOrderToPartner);

// ## Routes for Customers ##
// Consistent parameter name ':id' for the order
router.route('/track/:id').get(protect, mongoIdParamValidation, trackOrder);
// 2. YEH NAYA ROUTE ADD HUA HAI
router.route('/eta/:id').get(protect, mongoIdParamValidation, getOrderETA);

module.exports = router;