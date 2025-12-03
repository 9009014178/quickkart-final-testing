const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const Order = require("../models/orderModel.js");
const User = require("../models/userModel.js");
const Coupon = require("../models/couponModel.js");
const Product = require("../models/productModel.js");
const { sendEmail } = require("./authController.js");
const sendSms = require("../utils/sendSms.js");
const sendPushNotification = require("../utils/sendPushNotification.js");

// Initialize Razorpay if credentials are present
let razorpayInstance;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("⚠️ Razorpay keys not found — online payment disabled.");
}

// ===============================
// ✅ ADD ORDER ITEMS (MAIN FUNCTION)
// ===============================
const addOrderItems = asyncHandler(async (req, res) => {
  console.log("Incoming order body:", req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Order validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { shippingAddressId, couponCode, paymentMethod, orderItems } = req.body;

  // Validate order items
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({ message: "No order items provided" });
  }

  const user = await User.findById(req.user._id).select(
    "name email phone fcmToken allowSmsNotifications addresses cart"
  );
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  const shippingAddress =
    (shippingAddressId && user.addresses.id(shippingAddressId)) ||
    user.addresses[0];

  if (!shippingAddress) {
    return res.status(400).json({ message: "Shipping address not found" });
  }

  // Normalize items
  const normalizedItems = orderItems.map((item) => ({
    product: item.product || item._id,
    name: item.name,
    image: item.image,
    price: Number(item.price ?? 0),
    qty: Number(item.qty ?? item.quantity ?? 1),
  }));

  // Stock check
  for (const item of normalizedItems) {
    const product = await Product.findById(item.product);
    if (!product || !product.isAvailable) {
      return res
        .status(400)
        .json({ message: `Product "${item.name}" is unavailable` });
    }

    // ✅ handle products without inventory gracefully
const totalStock = Array.isArray(product.inventory)
  ? product.inventory.reduce((acc, inv) => acc + (inv.stock || 0), 0)
  : product.countInStock || 99999; // fallback: treat as available if undefined

if (totalStock < item.qty) {
  return res
    .status(400)
    .json({ message: `Not enough stock for "${item.name}"` });
}

  }

  // Price calculations
  const itemsPrice = normalizedItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  let discountAmount = 0;
  let validCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (
      coupon &&
      coupon.isActive &&
      coupon.expiryDate >= new Date() &&
      (coupon.usageLimit === null || coupon.usageLimit > coupon.usedCount) &&
      itemsPrice >= coupon.minOrderAmount
    ) {
      discountAmount =
        coupon.discountType === "Percentage"
          ? (itemsPrice * coupon.discountValue) / 100
          : coupon.discountValue;
      discountAmount = Math.min(discountAmount, itemsPrice);
      validCoupon = coupon;
    } else {
      return res.status(400).json({ message: "Invalid or expired coupon" });
    }
  }

  const priceAfterDiscount = itemsPrice - discountAmount;
  const taxPrice = parseFloat((priceAfterDiscount * 0.05).toFixed(2));
  const shippingPrice = 20.0;
  const totalPrice = parseFloat(
    (priceAfterDiscount + taxPrice + shippingPrice).toFixed(2)
  );

  // Create Order
  const order = new Order({
    user: req.user._id,
    orderItems: normalizedItems,
    shippingAddress: {
      addressLine1: shippingAddress.addressLine1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.pincode,
    },
    paymentMethod,
    couponCode: validCoupon ? validCoupon.code : null,
    discountAmount,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderStatus: "Pending Payment",
  });

  // COD Payment
  if (paymentMethod === "Cash on Delivery") {
    order.orderStatus = "Placed";
    const createdOrder = await order.save();

    // Decrease stock
    const bulkOps = normalizedItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product, "inventory.0": { $exists: true } },
        update: { $inc: { "inventory.0.stock": -item.qty } },
      },
    }));
    await Product.bulkWrite(bulkOps);

    if (validCoupon) {
      validCoupon.usedCount += 1;
      if (
        validCoupon.usageLimit &&
        validCoupon.usedCount >= validCoupon.usageLimit
      ) {
        validCoupon.isActive = false;
      }
      await validCoupon.save();
    }

    user.cart = [];
    await user.save();

    // Send notification
    const title = `Order Placed! (#${createdOrder._id.toString().slice(-6)})`;
    const msg = `Your COD order for ₹${createdOrder.totalPrice.toFixed(
      2
    )} is confirmed.`;

    if (user.email)
      sendEmail({
        email: user.email,
        subject: `QuickKart: ${title}`,
        message: msg,
      });
    if (user.phone && user.allowSmsNotifications) sendSms(user.phone, msg);
    if (user.fcmToken)
      sendPushNotification(user.fcmToken, title, msg, {
        orderId: createdOrder._id.toString(),
      });

    return res.status(201).json(createdOrder);
  }

  // Online payment
  if (paymentMethod === "Online") {
    if (!razorpayInstance)
      throw new Error("Razorpay not configured in environment.");

    const createdOrder = await order.save();
    const options = {
      amount: Math.round(totalPrice * 100),
      currency: "INR",
      receipt: `receipt_${createdOrder._id}`,
      notes: { order_db_id: createdOrder._id.toString() },
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);
    createdOrder.paymentResult = { order_id: razorpayOrder.id };
    await createdOrder.save();

    return res.status(201).json({
      ...createdOrder.toObject(),
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  }

  res.status(400).json({ message: "Invalid payment method" });
});

// ===============================
// ✅ OTHER FUNCTIONS
// ===============================
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const order = await Order.findOne({
    "paymentResult.order_id": razorpay_order_id,
  });
  if (!order) return res.status(404).json({ message: "Order not found" });

  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: razorpay_payment_id,
    status: "Success",
    order_id: razorpay_order_id,
    signature: razorpay_signature,
  };
  order.orderStatus = "Placed";
  const updatedOrder = await order.save();

  const user = await User.findById(order.user);
  if (user) {
    user.cart = [];
    await user.save();
  }

  res.json({ message: "Payment verified", order: updatedOrder });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "Admin"
  )
    return res.status(401).json({ message: "Not authorized" });
  res.json(order);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  order.orderStatus = "Cancelled";
  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "id name")
    .sort({ createdAt: -1 });
  res.json(orders);
});

module.exports = {
  addOrderItems,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrders,
};
