const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator'); // Import validationResult
const Settings = require('../models/settingsModel.js');

/**
 * @desc    Get site settings
 * @route   GET /api/settings
 * @access  Private/Admin
 */
const getSettings = asyncHandler(async (req, res) => {
    // Find or create the settings document if it doesn't exist
    // Uses findOneAndUpdate with upsert to ensure only one settings doc exists
    let settings = await Settings.findOneAndUpdate(
        { siteIdentifier: 'quickkart_settings' }, // Find by unique identifier
        { $setOnInsert: { siteIdentifier: 'quickkart_settings' } }, // Set identifier only on creation
        { upsert: true, new: true, setDefaultsOnInsert: true } // Create if not found, return new doc, apply defaults
    );
    res.json(settings);
});

/**
 * @desc    Update site settings
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
const updateSettings = asyncHandler(async (req, res) => {
    // Check validation errors first (rules defined in settingsRoutes.js)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // --- Continue if validation passes ---
    // Destructure all possible settings from the request body
    const { deliverySearchRadius, deliveryStartTime, deliveryEndTime, allowedPincodes, lowStockThreshold } = req.body;

    // Find the single settings document (or create if missing)
    let settings = await Settings.findOneAndUpdate(
        { siteIdentifier: 'quickkart_settings' },
        {}, // No update here, just find or create
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update fields only if they are explicitly provided in the request body
    if (req.body.hasOwnProperty('deliverySearchRadius')) {
        settings.deliverySearchRadius = deliverySearchRadius;
    }
    if (req.body.hasOwnProperty('deliveryStartTime')) {
        // Validation ensures HH:MM format
        settings.deliveryStartTime = deliveryStartTime;
    }
    if (req.body.hasOwnProperty('deliveryEndTime')) {
        // Validation ensures HH:MM format
        settings.deliveryEndTime = deliveryEndTime;
    }
    if (allowedPincodes !== undefined && Array.isArray(allowedPincodes)) {
        // Validation ensures pincodes are valid
        settings.allowedPincodes = [...new Set(allowedPincodes.map(p => String(p).trim()))];
    }
    // ## ADDED LOW STOCK UPDATE ##
    if (req.body.hasOwnProperty('lowStockThreshold')) {
        settings.lowStockThreshold = lowStockThreshold;
    }
    // ###########################

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
});

module.exports = {
    getSettings,
    updateSettings,
};