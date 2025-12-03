const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Address schema remains the same
const addressSchema = mongoose.Schema({
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  state: { type: String, required: true },
});

// CartItem schema (with store field for zonal inventory)
const cartItemSchema = mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'DarkStore', // Link to the DarkStore
  },
});

// Subscription schema
const subscriptionSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    store: { // Which store is this subscription from
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'DarkStore',
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    frequency: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly'],
        required: true,
    },
    nextDeliveryDate: { // When the next order should be created
        type: Date,
        required: true,
    },
    shippingAddress: { // The address for this subscription
        type: addressSchema,
        required: true,
    },
    isActive: { // To pause or cancel the subscription
        type: Boolean,
        default: true,
    },
}, { timestamps: true });


// Main User Schema
const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'Delivery Partner', 'admin'], default: 'customer' },

    // Fields for Delivery Partners
    isOnline: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
      },
    },

    addresses: [addressSchema],
    cart: [cartItemSchema],
    subscriptions: [subscriptionSchema], // For subscription orders

    lastCartUpdate: {
        type: Date,
        default: Date.now,
    },
    lastLogin: {
        type: Date,
        default: Date.now,
    },

    // ## PUSH NOTIFICATION KE LIYE YEH ADD HUA HAI ##
    fcmToken: {
        type: String, // Firebase Cloud Messaging token (device ID)
    },
    // #########################################

    allowEmailPromotions: { type: Boolean, default: true },
    allowSmsNotifications: { type: Boolean, default: true },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to create password reset OTP
userSchema.methods.createPasswordResetOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.passwordResetToken = otp;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return otp;
};

const User = mongoose.model('User', userSchema);

module.exports = User;