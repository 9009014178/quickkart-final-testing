// src/models/productModel.js
const mongoose = require('mongoose');

// --- Review sub-schema ---
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

// --- Product schema ---
const productSchema = mongoose.Schema(
  {
    // Admin who created it (OPTIONAL for seed / manual insert)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,           // 👈 made optional so seeding is easy
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Simple image path or URL
    // e.g. "/uploads/products/coca-cola-can-300ml.jpg"
    // or "https://something.com/image.jpg"
    image: {
      type: String,
      required: true,            // you are already providing "image" in seed JSON
      trim: true,
    },

    // For Cloudinary / other providers (OPTIONAL for now)
    imagePublicId: {
      type: String,
      required: false,           // 👈 made optional so seeding doesn't fail
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

    // Optional features list
    features: {
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

    // Simple stock field (no dark store / inventory complexity)
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Optional sale price
    salePrice: {
      type: Number,
      min: 0,
    },

    saleEndDate: {
      type: Date,
    },

    isAvailable: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// --- Indexes ---
productSchema.index({
  name: 'text',
  description: 'text',
  category: 1,
  brand: 1,
});
productSchema.index({ isAvailable: 1, stock: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
