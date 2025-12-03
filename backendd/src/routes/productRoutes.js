const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator'); 
const {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  // ❌ updateInventoryForStore is removed here
  getAllProductsAdmin, 
} = require('../controllers/productController.js'); // Ensure updateInventoryForStore is NOT imported

const { protect, isAdmin } = require('../middlewares/authMiddleware.js');
const upload = require('../config/fileUpload');

// --- Validation Rules ---
// ... (Validation rules remain the same: productValidationRules, reviewValidationRules, mongoIdParamValidation) ...
const productValidationRules = [ /* ... */ ];
const reviewValidationRules = [ /* ... */ ];
// ❌ Remove inventoryValidationRules if only used by the deleted route
// const inventoryValidationRules = [ /* ... */ ]; 
const mongoIdParamValidation = [ /* ... */ ];
const reviewParamValidation = [ /* ... */ ];


// --- Route Definitions ---

// --- Admin Route ---
// GET /api/products/all - Gets ALL products, no filters, for admin
router.route('/all').get(protect, isAdmin, getAllProductsAdmin);

// --- Public Routes ---
// GET /api/products - Get all available products (public, potentially filtered)
router.route('/').get(getProducts);

// --- Routes with ':id' Parameter ---

// GET /api/products/:id - Get a single product by ID
// PUT /api/products/:id - Update a product (Admin only)
// DELETE /api/products/:id - Delete a product (Admin only)
router.route('/:id')
  .get(mongoIdParamValidation, getProductById) // Public GET for single product
  .delete(protect, isAdmin, mongoIdParamValidation, deleteProduct) // Admin DELETE
  .put( // Admin PUT
    protect,
    isAdmin,
    upload.single('image'),
    [...mongoIdParamValidation, ...productValidationRules], // Ensure updateProduct function exists and is imported
    updateProduct 
  );

// POST /api/products/:id/reviews - Create a new review for a product (User)
router.route('/:id/reviews').post(protect, [...reviewParamValidation, ...reviewValidationRules], createProductReview);

// --- Admin Route ---
// POST /api/products - Create a new product (Admin only)
router.route('/').post(
  protect,
  isAdmin,
  upload.single('image'),
  // Consider adding createProductValidation rules here if needed
  createProduct
);

// ❌ Removed the route for updating inventory
// router.route('/:productId/inventory')
//   .put(protect, isAdmin, inventoryValidationRules, updateInventoryForStore);


module.exports = router;