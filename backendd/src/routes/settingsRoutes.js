const express = require('express');
const router = express.Router();
const { body } = require('express-validator'); // Import body
const { getSettings, updateSettings } = require('../controllers/settingsController.js');
const { protect } = require('../middlewares/authMiddleware.js');
const { admin } = require('../middlewares/adminMiddleware.js');

// --- Validation Rules for Settings ---
const settingsValidationRules = [
    // Ensure radius is a positive integer (meters) if provided
    body('deliverySearchRadius', 'Delivery radius must be a positive integer (meters)')
        .optional()
        .isInt({ gt: 0 }),

    // Check if the time is in HH:MM format (e.g., 08:00, 23:59)
    body('deliveryStartTime', 'Start time must be in HH:MM format (e.g., 09:00)')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/), // Regex for HH:MM (24-hour)
    body('deliveryEndTime', 'End time must be in HH:MM format (e.g., 22:30)')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/), // Regex for HH:MM (24-hour)

    // Pincode array validation
    body('allowedPincodes', 'Allowed pincodes must be an array of strings')
        .optional() // Allow request without this field
        .isArray(),
    // Validate each element within the allowedPincodes array
    body('allowedPincodes.*', 'Each allowed pincode must be a valid Indian pincode')
        .if(body('allowedPincodes').exists()) // Only validate elements if the array exists
        .isPostalCode('IN'),
        
    // ## ADDED VALIDATION FOR LOW STOCK ##
    body('lowStockThreshold', 'Low stock threshold must be a positive integer')
        .optional()
        .isInt({ gt: 0 }) // Must be a positive integer (e.g., 1 or greater)
    // ####################################
];
// --- End Validation Rules ---


// Apply validation rules to the PUT route
router.route('/')
    .get(protect, admin, getSettings)
    .put(protect, admin, settingsValidationRules, updateSettings); // Rules apply here

module.exports = router;