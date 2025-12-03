const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: false, default: "" },

        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
   shippingAddress: {
  addressLine1: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },

  // ✅ Optional location, no geo index needed
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
},

    paymentMethod: {
      type: String,
      required: true,
      enum: ['Cash on Delivery', 'Online'], // 'Online' option added
      default: 'Cash on Delivery',
    },

    // ## ADDED FOR ONLINE PAYMENT ##
    paymentResult: {
        id: { type: String }, // Razorpay Payment ID
        order_id: { type: String }, // Razorpay Order ID
        signature: { type: String },
        status: { type: String }, // e.g., 'Success', 'Failed'
    },
    // ###########################

    couponCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    discountAmount: {
      type: Number,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: { // Final grand total
      type: Number,
      required: true,
      default: 0.0,
    },
    orderStatus: {
      type: String,
      required: true,
      // 'Pending Payment' added to enum and set as default
      enum: ['Pending Payment', 'Placed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending Payment',
    },
    darkStore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DarkStore',
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false, // Default is false, will be true after payment
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    deliveryRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    deliveryFeedback: {
      type: String,
    },
    // ## ISSUE REPORTING OBJECT ##
    issueReport: {
      issueType: {
        type: String,
        enum: ['Late Delivery', 'Wrong Item', 'Missing Item', 'Damaged Item', 'Other'],
      },
      description: { type: String },
      status: {
        type: String,
        enum: ['Pending', 'Investigating', 'Resolved', 'Rejected'],
        default: 'Pending',
      },
      resolution: { type: String },
      reportedAt: { type: Date },
      refundDetails: {
        isRequested: { type: Boolean, default: false },
        requestAmount: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['Pending', 'Approved', 'Rejected'],
          default: 'Pending',
        },
        processedAt: { type: Date },
      }
    },
    // #############################
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Add a geospatial index
// orderSchema.index({ 'shippingAddress.location': '2dsphere' });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;