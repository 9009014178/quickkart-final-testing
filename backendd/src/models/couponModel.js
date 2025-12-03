const mongoose = require('mongoose');

const couponSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true, // Store codes in uppercase for easier comparison
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['Percentage', 'FixedAmount'], // Type of discount
    },
    discountValue: {
      type: Number,
      required: true, // e.g., 10 for 10% or 100 for ₹100 off
    },
    minOrderAmount: {
      type: Number,
      default: 0, // Minimum cart value to apply the coupon
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true, // Allows admin to disable a coupon
    },
    usageLimit: {
      type: Number, // How many times can this coupon be used in total
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;