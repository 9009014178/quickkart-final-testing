const mongoose = require('mongoose');

// Review sub-schema (no change needed here)
const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// ❌ Removed inventorySchema - Not needed for simple stock

// Product schema
const productSchema = mongoose.Schema(
  {
    user: { // Admin who created it
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: { // Cloudinary URL
      type: String,
      required: true,
    },
    imagePublicId: { // Cloudinary Public ID
      type: String,
      required: true, // Assuming you always have this after upload
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    features: { // Features array
        type: [String],
        default: [],
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    // ✅ Use a simple 'stock' field for total quantity
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // Stock cannot be negative
    },

    // ❌ Removed inventory array
    // inventory: [inventorySchema],

    salePrice: {
      type: Number,
      min: 0,
    },
    saleEndDate: {
      type: Date,
    },
    isAvailable: { // General availability flag (can be linked to stock > 0)
      type: Boolean,
      required: true,
      default: true,
    },

    // ❌ Removed unavailablePincodes
    // unavailablePincodes: {
    //   type: [String],
    //   default: [],
    // },
  },
  {
    timestamps: true,
  }
);

// Optional: Adjust indexes if needed
productSchema.index({ name: 'text', description: 'text', category: 1, brand: 1 });
productSchema.index({ isAvailable: 1, stock: 1 }); // Index for simple stock check

const Product = mongoose.model('Product', productSchema);

module.exports = Product;