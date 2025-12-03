const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator'); // 1. Import body and param
const {
  getCartItems,
  addItemToCart,
  removeItemFromCart,
} = require('../controllers/cartController.js');
const { protect } = require('../middlewares/authMiddleware.js');

// --- Validation Rules for Adding/Updating Cart ---
const cartItemValidationRules = [
  body('productId', 'Product ID is required').isMongoId().withMessage('Invalid Product ID'),
  body('qty', 'Quantity must be a positive integer').isInt({ gt: 0 }),
  body('pincode', 'Pincode is required to find nearest store').isPostalCode('IN').withMessage('Invalid Indian Pincode'), // 2. Pincode is now required
];
// --- End Validation Rules ---

// GET /api/cart - Get all items
// POST /api/cart - Add/Update item
router.route('/')
    .get(protect, getCartItems)
    .post(protect, cartItemValidationRules, addItemToCart); // Apply updated rules

// DELETE /api/cart/:cartItemId - Remove an item from cart
// 3. Changed route from /:productId to /:cartItemId
router.route('/:cartItemId')
    .delete(
        protect,
        [param('cartItemId', 'Invalid Cart Item ID').isMongoId()], // 4. Add validation for the ID
        removeItemFromCart
    );

module.exports = router;