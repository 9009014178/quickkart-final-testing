const User = require('../models/userModel.js');
const Order = require('../models/orderModel.js');
const Product = require('../models/productModel.js');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <<< ADDED: For password comparison

// --- User Profile Functions ---

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -cart -addresses -passwordResetToken -passwordResetExpires -subscriptions');
  if (user) {
     res.status(200).json(user);
  } else {
     res.status(404); throw new Error('User not found');
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    // Prevent email change via this route if desired, uncomment below
    // if (req.body.email && req.body.email !== user.email) {
    //    res.status(400); throw new Error('Email cannot be changed via profile update.');
    // }
    user.phone = req.body.phone || user.phone;
    // Do NOT allow password change here - use dedicated changePassword route
    // if (req.body.password) { user.password = req.body.password; }
    if (req.body.allowEmailPromotions !== undefined) user.allowEmailPromotions = req.body.allowEmailPromotions;
    if (req.body.allowSmsNotifications !== undefined) user.allowSmsNotifications = req.body.allowSmsNotifications;

    const updatedUser = await user.save();
    res.status(200).json({ // Return only non-sensitive fields
      _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email,
      phone: updatedUser.phone, role: updatedUser.role,
      allowEmailPromotions: updatedUser.allowEmailPromotions,
      allowSmsNotifications: updatedUser.allowSmsNotifications,
    });
  } else {
    res.status(404); throw new Error('User not found');
  }
});

// --- Address Functions ---

const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.status(200).json(user.addresses);
  } else {
    res.status(404); throw new Error('User not found');
  }
});

const addAddress = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findById(req.user._id);
  if (user) {
    const { addressLine1, addressLine2, city, pincode, state, isDefault } = req.body;
    const newAddress = { addressLine1, addressLine2, city, pincode, state, isDefault: Boolean(isDefault) };
    if (newAddress.isDefault) user.addresses.forEach(addr => addr.isDefault = false);
    user.addresses.push(newAddress);
    await user.save();
    res.status(201).json(user.addresses); // Return updated list
  } else {
    res.status(404); throw new Error('User not found');
  }
});

const updateAddress = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findById(req.user._id);
  if (user) {
    const address = user.addresses.id(req.params.id);
    if (address) {
      const { addressLine1, addressLine2, city, pincode, state, isDefault } = req.body;
      address.addressLine1 = addressLine1 || address.addressLine1;
      address.addressLine2 = req.body.hasOwnProperty('addressLine2') ? addressLine2 : address.addressLine2;
      address.city = city || address.city;
      address.pincode = pincode || address.pincode;
      address.state = state || address.state;
      address.isDefault = req.body.hasOwnProperty('isDefault') ? Boolean(isDefault) : address.isDefault;

      // If setting this one as default, unset others
      if (address.isDefault) {
          user.addresses.forEach(addr => {
              if (addr._id.toString() !== req.params.id) {
                 addr.isDefault = false;
              }
          });
      }

      await user.save();
      res.status(200).json(user.addresses); // Return updated list
    } else {
      res.status(404); throw new Error('Address not found');
    }
  } else {
    res.status(404); throw new Error('User not found');
  }
});

const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const addressId = req.params.id;
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);

    if (addressIndex > -1) {
      user.addresses.splice(addressIndex, 1); // Remove from array
      await user.save();
      res.status(200).json(user.addresses); // <<< MODIFIED: Return updated list
    } else {
      res.status(404); throw new Error('Address not found');
    }
  } else {
    res.status(404); throw new Error('User not found');
  }
});


// --- Password Change Function ---
// <<< ADDED THIS ENTIRE FUNCTION >>>
/**
 * @desc    Change user password
 * @route   PUT /api/users/profile/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404); throw new Error('User not found');
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword); // Assumes userModel has matchPassword method
    if (!isMatch) {
        res.status(401); // Unauthorized
        throw new Error('Invalid current password.');
    }

    // Set the new password (pre-save hook in userModel will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
});
// <<< END ADDED FUNCTION >>>


// --- Quick Reorder Function ---
const quickReorder = asyncHandler(async (req, res) => {
    // ... (Your existing code looks okay)
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const order = await Order.findById(req.params.orderId);
    const user = await User.findById(req.user._id);
    if (!order || order.user.toString() !== req.user._id.toString()) {
        res.status(404); throw new Error('Order not found or not authorized');
    }
    if (!user) { res.status(404); throw new Error('User not found'); }
    if (!order.darkStore) { res.status(400); throw new Error('Cannot reorder: Order not linked to a store.'); }
    let itemsSkipped = 0;
    for (const orderItem of order.orderItems) {
        const product = await Product.findById(orderItem.product);
        const storeInventory = product ? product.inventory.find(inv => inv.store.toString() === order.darkStore.toString()) : null;
        if (!product || !product.isAvailable || !storeInventory || storeInventory.stock < orderItem.qty) {
            itemsSkipped++; continue;
        }
        const existItemIndex = user.cart.findIndex(cartItem => cartItem.product.toString() === orderItem.product.toString() && cartItem.store.toString() === order.darkStore.toString());
        if (existItemIndex > -1) {
             if(storeInventory.stock < (user.cart[existItemIndex].qty + orderItem.qty)) user.cart[existItemIndex].qty = storeInventory.stock;
             else user.cart[existItemIndex].qty += orderItem.qty;
        } else {
            user.cart.push({ product: orderItem.product, name: orderItem.name, image: orderItem.image, price: orderItem.price, qty: orderItem.qty, store: order.darkStore });
        }
    }
    user.lastCartUpdate = Date.now();
    const updatedUser = await user.save();
    await updatedUser.populate('cart.product', 'name price image isAvailable');
    await updatedUser.populate('cart.store', 'name pincode');
    let message = 'Items added to cart successfully.';
    if(itemsSkipped > 0) message = `${itemsSkipped} item(s) skipped due to unavailability/stock. ${message}`;
    res.status(200).json({message: message, cart: updatedUser.cart});
});

// --- Push Notification Function ---
const registerDeviceForPush = asyncHandler(async (req, res) => {
    // ... (Your existing code looks okay)
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { fcmToken } = req.body;
    const user = await User.findById(req.user._id);
    if (user) {
        user.fcmToken = fcmToken; await user.save();
        res.json({ message: 'Device registered for notifications successfully' });
    } else {
        res.status(404); throw new Error('User not found');
    }
});


// --- ADMIN USER MANAGEMENT FUNCTIONS ---
const getUsers = asyncHandler(async (req, res) => { /* ... */ });
const getUserById = asyncHandler(async (req, res) => { /* ... */ });
const deleteUser = asyncHandler(async (req, res) => { /* ... */ });
const updateUser = asyncHandler(async (req, res) => { /* ... */ });
const getDeliveryPartners = asyncHandler(async (req, res) => { /* ... */ });


// --- FINAL EXPORTS ---
module.exports = {
  // User profile & related
  getUserProfile,
  updateUserProfile,
  changePassword, // <<< ADDED
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  quickReorder,
  // Admin User Management
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
  getDeliveryPartners,
  // Push Notifications
  registerDeviceForPush,
};