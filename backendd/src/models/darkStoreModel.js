const mongoose = require('mongoose');

const darkStoreSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // e.g., "QuickKart - Vijay Nagar"
    },
    pincode: {
      type: String,
      required: true,
      index: true, // Index for fast lookups by pincode
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    // We will manage product inventory in the Product model itself
    // to make product-centric queries easier.
  },
  { timestamps: true }
);

// Add geospatial index for finding nearest store
darkStoreSchema.index({ location: '2dsphere' });

const DarkStore = mongoose.model('DarkStore', darkStoreSchema);

module.exports = DarkStore;