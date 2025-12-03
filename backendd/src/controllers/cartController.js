const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/userModel.js');
const Product = require('../models/productModel.js');
const DarkStore = require('../models/darkStoreModel.js'); // 1. Import DarkStore

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCartItems = asyncHandler(async (req, res) => {
  // Populate product details AND store details for frontend
  const user = await User.findById(req.user._id)
    .populate('cart.product', 'name price image isAvailable') // We don't need countInStock here
    .populate('cart.store', 'name pincode'); // 2. Populate store info

  if (user) {
    res.json(user.cart);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Add or update item in cart (Zonal Inventory Logic)
 * @route   POST /api/cart
 * @access  Private
 */
const addItemToCart = asyncHandler(async (req, res) => {
  // Check for validation errors first
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // --- If validation passes, continue ---
  const { productId, qty, pincode } = req.body; // Pincode is now required
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404); throw new Error('User not found');
  }

  // 3. Find the Dark Store based on customer's pincode
  const store = await DarkStore.findOne({ pincode: pincode });
  if (!store) {
      res.status(404);
      throw new Error('Sorry, delivery is not available in your pincode yet.');
  }

  // 4. Find the Product
  const product = await Product.findById(productId);
  if (!product || !product.isAvailable) {
    res.status(404); throw new Error('Product not found or is unavailable');
  }

  // 5. Find the specific inventory entry for this product at this store
  const storeInventory = product.inventory.find(
      (inv) => inv.store.toString() === store._id.toString()
  );

  // 6. Check stock at that specific store
  if (!storeInventory || storeInventory.stock < qty) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}. Only ${storeInventory ? storeInventory.stock : 0} available at your nearest store.`);
  }

  // 7. Check if item (from the same store) already exists in cart
  const existItemIndex = user.cart.findIndex(
    (x) => x.product.toString() === productId && x.store.toString() === store._id.toString()
  );

  if (existItemIndex > -1) {
    // If item exists, update the quantity
    user.cart[existItemIndex].qty = qty;
  } else {
    // If item does not exist, add it
    const cartItem = {
      product: productId,
      name: product.name,
      image: product.image,
      // Use sale price if applicable and valid
      price: (product.salePrice && product.saleEndDate && product.saleEndDate > new Date()) ? product.salePrice : product.price,
      qty,
      store: store._id, // 8. Save which store this item is from
    };
    user.cart.push(cartItem);
  }

  // Update lastCartUpdate timestamp
  user.lastCartUpdate = Date.now();
  await user.save();

  // Populate product details when sending cart back
  const updatedUser = await User.findById(req.user._id)
    .populate('cart.product', 'name price image isAvailable')
    .populate('cart.store', 'name pincode');
    
  res.status(200).json(updatedUser.cart);
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:cartItemId
 * @access  Private
 */
const removeItemFromCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const cartItemId = req.params.cartItemId; // 9. We now delete by the unique cart item _id

  if (!user) {
    res.status(404); throw new Error('User not found');
  }

  // Find the item in the cart
  const itemExists = user.cart.find(
      (item) => item._id.toString() === cartItemId
  );

  if (!itemExists) {
     res.status(404); throw new Error('Item not found in cart');
  }

  // Mongoose's .pull() method is perfect for removing items from an array by _id
  user.cart.pull(cartItemId);

  // Update lastCartUpdate timestamp
  user.lastCartUpdate = Date.now();
  await user.save();
  
  res.json({ message: 'Item removed from cart' });
});

module.exports = {
  getCartItems,
  addItemToCart,
  removeItemFromCart,
};