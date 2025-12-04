// src/routes/productRoutes.js
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
  getAllProductsAdmin,
} = require('../controllers/productController.js');

const { protect, isAdmin } = require('../middlewares/authMiddleware.js');
const upload = require('../config/fileUpload');

// --------------------------------------------------
// Validation Rules
// --------------------------------------------------

// For creating/updating products
const productValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('brand')
    .optional()
    .isString()
    .withMessage('Brand must be a string'),
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('salePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Sale price must be a positive number'),
];

// For adding a review
const reviewValidationRules = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .notEmpty()
    .withMessage('Comment is required')
    .isString()
    .withMessage('Comment must be a string'),
];

// Validate ":id" param as a MongoDB ObjectId
const mongoIdParamValidation = [
  param('id', 'Valid product ID is required').isMongoId(),
];

// Same for review route (also uses :id)
const reviewParamValidation = [
  param('id', 'Valid product ID is required').isMongoId(),
];

// --------------------------------------------------
// Route Definitions
// --------------------------------------------------

// --- Admin Route ---
// GET /api/products/all - Gets ALL products, no filters, for admin
router.route('/all').get(protect, isAdmin, getAllProductsAdmin);

// --- Public + Admin Routes on "/" ---
// GET /api/products       - Public list (with filters/pagination as per controller)
// POST /api/products      - Admin create product
router
  .route('/')
  .get(getProducts)
  .post(
    protect,
    isAdmin,
    upload.single('image'),          // expects "image" field in form-data
    productValidationRules,
    createProduct
  );

// --- Routes with ':id' Parameter ---
// GET /api/products/:id   - Public single product
// PUT /api/products/:id   - Admin update
// DELETE /api/products/:id- Admin delete
router
  .route('/:id')
  .get(mongoIdParamValidation, getProductById)
  .delete(protect, isAdmin, mongoIdParamValidation, deleteProduct)
  .put(
    protect,
    isAdmin,
    upload.single('image'),
    [...mongoIdParamValidation, ...productValidationRules],
    updateProduct
  );

// POST /api/products/:id/reviews - Add a review (logged in user)
router
  .route('/:id/reviews')
  .post(
    protect,
    [...reviewParamValidation, ...reviewValidationRules],
    createProductReview
  );

module.exports = router;
