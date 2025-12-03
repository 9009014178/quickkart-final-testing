const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema({
  deliverySearchRadius: {
    type: Number, // Radius in meters
    required: true,
    default: 5000,
  },
  deliveryStartTime: {
    type: String, // e.g., "08:00" (HH:MM format, 24-hour clock)
    default: "08:00",
    required: true,
  },
  deliveryEndTime: {
    type: String, // e.g., "22:00" (HH:MM format, 24-hour clock)
    default: "22:00",
    required: true,
  },
  allowedPincodes: {
    type: [String], // An array of pincodes where delivery is available
    default: [],
  },

  // ## ADDED FOR LOW STOCK ALERTS ##
  lowStockThreshold: {
    type: Number,
    required: true,
    default: 10, // Default threshold is 10 items
  },
  // ##############################

  siteIdentifier: { // Used to ensure only one settings document exists
    type: String,
    default: 'quickkart_settings',
    unique: true,
    required: true,
  },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;